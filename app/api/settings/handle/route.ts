import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { validateHandleValue } from "@/features/validation/fieldLimits";

export async function GET(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const url = new URL(req.url);
  const handleInput = url.searchParams.get("handle") ?? "";
  const handleValidation = validateHandleValue(handleInput);

  if (!handleValidation.ok) {
    return NextResponse.json({
      ok: true,
      valid: false,
      available: false,
      reason: handleValidation.error,
    });
  }

  const handle = handleValidation.value;
  const supabase = await createSupabaseServerClient();

  const { data, error: lookupError } = await supabase.rpc(
    "check_organization_handle_availability",
    {
      p_organization_id: organizationId,
      p_handle: handle,
    }
  );

  if (lookupError) {
    console.error("[settings/handle] availability lookup failed", {
      userId: user.id,
      organizationId,
      handle,
      message: lookupError.message,
      code: lookupError.code,
      details: lookupError.details,
      hint: lookupError.hint,
    });
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const availability = Array.isArray(data) ? data[0] : data;

  return NextResponse.json({
    ok: true,
    valid: availability?.valid === true,
    available: availability?.available === true,
    current: availability?.current === true,
    ownHistory: availability?.own_history === true,
    reason: availability?.reason ?? null,
    cooldownUntil: availability?.cooldown_until ?? null,
  });
}

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json({ error: error ?? "organization not found" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const handleInput = typeof body?.handle === "string" ? body.handle : "";
  const handleValidation = validateHandleValue(handleInput);

  if (!handleValidation.ok) {
    return NextResponse.json({ error: handleValidation.error }, { status: 400 });
  }

  const handle = handleValidation.value;
  const supabase = await createSupabaseServerClient();

  const { data, error: updateErr } = await supabase.rpc(
    "change_organization_handle",
    { p_handle: handle }
  );

  if (updateErr) {
    console.error("[settings/handle] save failed", {
      userId: user.id,
      organizationId,
      handle,
      message: updateErr.message,
      code: updateErr.code,
      details: updateErr.details,
      hint: updateErr.hint,
    });
    return NextResponse.json(
      { error: updateErr.message || "예약 링크 저장 중 오류가 발생했어요." },
      { status: 400 }
    );
  }

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ ok: true, handle: row?.handle ?? handle });
}
