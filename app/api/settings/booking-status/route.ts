import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json({ error: error ?? "organization not found" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const bookingEnabled =
    typeof body?.booking_enabled === "boolean" ? body.booking_enabled : null;

  if (bookingEnabled === null) {
    return NextResponse.json({ error: "예약 접수 상태를 선택해주세요." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: updateErr } = await supabase
    .from("organizations")
    .update({ booking_enabled: bookingEnabled })
    .eq("id", organizationId);

  if (updateErr) {
    console.error("[settings/booking-status] update failed", {
      userId: user.id,
      organizationId,
      bookingEnabled,
      message: updateErr.message,
      code: updateErr.code,
      details: updateErr.details,
      hint: updateErr.hint,
    });
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, booking_enabled: bookingEnabled });
}
