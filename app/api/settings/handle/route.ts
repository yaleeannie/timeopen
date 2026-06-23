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

  const { data: existing, error: lookupError } = await supabase
    .from("organizations")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

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

  return NextResponse.json({
    ok: true,
    valid: true,
    available: !existing || existing.id === organizationId,
    current: existing?.id === organizationId,
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

  // 중복 체크
  const { data: existing, error: lookupError } = await supabase
    .from("organizations")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (lookupError) {
    console.error("[settings/handle] save lookup failed", {
      userId: user.id,
      organizationId,
      handle,
      message: lookupError.message,
      code: lookupError.code,
      details: lookupError.details,
      hint: lookupError.hint,
    });
    return NextResponse.json({ error: "예약 링크 확인 중 오류가 발생했어요." }, { status: 400 });
  }

  if (existing && existing.id !== organizationId) {
    return NextResponse.json({ error: "이미 사용 중인 예약 링크예요." }, { status: 400 });
  }

  const { error: updateErr } = await supabase
    .from("organizations")
    .update({ handle })
    .eq("id", organizationId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
