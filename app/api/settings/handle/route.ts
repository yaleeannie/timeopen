import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { validateHandleValue } from "@/features/validation/fieldLimits";

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
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (existing && existing.id !== organizationId) {
    return NextResponse.json({ error: "이미 사용 중인 handle입니다." }, { status: 400 });
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
