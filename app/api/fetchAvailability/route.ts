// app/api/fetchAvailability/route.ts
import { NextResponse } from "next/server";
import { normalizeBookingSlotInterval } from "@/features/booking/slotMode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { handle } = await req.json();

  if (!handle) {
    return NextResponse.json({ data: [], error: "Missing handle" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const [availabilityResult, organizationResult] = await Promise.all([
    supabase.rpc("get_availability_rows_by_handle", {
      p_handle: handle,
    }),
    supabase.rpc("get_public_booking_settings_by_handle", {
      p_handle: handle,
    }),
  ]);

  const { data, error } = availabilityResult;

  if (error) {
    return NextResponse.json({ data: [], error: error.message }, { status: 500 });
  }

  if (organizationResult.error) {
    console.error("[fetchAvailability] organization interval load failed", {
      handle,
      supabaseCode: organizationResult.error.code,
      supabaseMessage: organizationResult.error.message,
      supabaseDetails: organizationResult.error.details,
      supabaseHint: organizationResult.error.hint,
    });
  }

  const organization = Array.isArray(organizationResult.data)
    ? organizationResult.data[0] ?? null
    : organizationResult.data;
  const bookingSlotIntervalMin = normalizeBookingSlotInterval(
    organization?.booking_slot_interval_min
  );

  if (process.env.NODE_ENV !== "production") {
    console.log("[fetchAvailability] slot interval", {
      handle,
      organizationId: organization?.id ?? null,
      booking_slot_interval_min: organization?.booking_slot_interval_min ?? null,
      generatedSlotStep: bookingSlotIntervalMin,
    });
  }

  return NextResponse.json({
    data: data ?? [],
    booking_slot_interval_min: bookingSlotIntervalMin,
  });
}
