import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { validateWithdrawalReason } from "@/features/validation/fieldLimits";

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json({ error: error ?? "organization not found" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const reasonInput = typeof body?.reason === "string" ? body.reason : "";
  const reasonValidation = validateWithdrawalReason(reasonInput);

  if (!reasonValidation.ok) {
    return NextResponse.json({ error: reasonValidation.error }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const now = new Date().toISOString();

  const { error: updateErr } = await supabase
    .from("organizations")
    .update({
      withdrawal_requested_at: now,
      withdrawal_reason: reasonValidation.value || null,
      disabled_at: now,
      booking_enabled: false,
    })
    .eq("id", organizationId);

  if (updateErr) {
    console.error("[settings/withdrawal] update failed", {
      userId: user.id,
      organizationId,
      message: updateErr.message,
      code: updateErr.code,
      details: updateErr.details,
      hint: updateErr.hint,
    });
    return NextResponse.json({ error: "탈퇴 요청 처리 중 오류가 발생했습니다." }, { status: 400 });
  }

  const { error: signOutError } = await supabase.auth.signOut();
  if (signOutError) {
    console.error("[settings/withdrawal] signout failed", {
      userId: user.id,
      organizationId,
      message: signOutError.message,
    });
  }

  return NextResponse.json({ ok: true });
}
