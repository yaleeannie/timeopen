import { NextResponse } from "next/server";
import {
  type BookingSlotIntervalMinutes,
  type BookingSlotMode,
  validateBookingSlotInterval,
  validateBookingSlotMode,
} from "@/features/booking/slotMode";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json(
      { error: error ?? "샵 정보를 찾을 수 없습니다." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const updates: {
    booking_slot_mode?: BookingSlotMode;
    booking_slot_interval_min?: BookingSlotIntervalMinutes;
  } = {};

  if (body && Object.prototype.hasOwnProperty.call(body, "booking_slot_mode")) {
    const validation = validateBookingSlotMode(body?.booking_slot_mode);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    updates.booking_slot_mode = validation.value as BookingSlotMode;
  }

  if (body && Object.prototype.hasOwnProperty.call(body, "booking_slot_interval_min")) {
    const validation = validateBookingSlotInterval(body?.booking_slot_interval_min);

    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    updates.booking_slot_interval_min = validation.value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "저장할 예약 설정이 없습니다." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", organizationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ...updates });
}
