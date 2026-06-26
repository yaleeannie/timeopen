import { NextResponse } from "next/server";
import { validateBookingConfirmationMode } from "@/features/booking/confirmationMode";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json(
      { error: error ?? "organization not found" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const validation = validateBookingConfirmationMode(
    body?.booking_confirmation_mode
  );

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("organizations")
    .update({ booking_confirmation_mode: validation.value })
    .eq("id", organizationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
