// app/api/fetchAvailability/route.ts
import { NextResponse } from "next/server";
import { normalizeBookingSlotInterval } from "@/features/booking/slotMode";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const toHHMM = (value: unknown) => (typeof value === "string" ? value.slice(0, 5) : "");

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const handle = typeof body?.handle === "string" ? body.handle.trim() : "";
  const requestedDate =
    typeof body?.date === "string"
      ? body.date
      : typeof body?.dateISO === "string"
        ? body.dateISO
        : "";
  const shouldLoadTimeBlocks = DATE_RE.test(requestedDate);

  if (!handle) {
    return NextResponse.json({ data: [], error: "Missing handle" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const [availabilityResult, organizationResult, timeBlocksResult] = await Promise.all([
    supabase.rpc("get_availability_rows_by_handle", {
      p_handle: handle,
    }),
    supabase.rpc("get_public_booking_settings_by_handle", {
      p_handle: handle,
    }),
    shouldLoadTimeBlocks
      ? supabase.rpc("get_public_reservation_time_blocks", {
          p_handle: handle,
          p_date: requestedDate,
        })
      : Promise.resolve({ data: [], error: null }),
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
  const timeBlocks = (timeBlocksResult.data ?? [])
    .filter((row: any) => row?.start_time && row?.end_time)
    .map((row: any) => ({
      start: toHHMM(row.start_time),
      end: toHHMM(row.end_time),
    }));

  if (process.env.NODE_ENV !== "production") {
    console.log("[fetchAvailability] slot interval", {
      handle,
      requestedDate: shouldLoadTimeBlocks ? requestedDate : null,
      organizationId: organization?.id ?? null,
      booking_slot_interval_min: organization?.booking_slot_interval_min ?? null,
      generatedSlotStep: bookingSlotIntervalMin,
      loadedBlockCount: timeBlocks.length,
    });
  }

  if (timeBlocksResult.error) {
    console.error("[fetchAvailability] public time block load failed", {
      handle,
      requestedDate,
      supabaseCode: timeBlocksResult.error.code,
      supabaseMessage: timeBlocksResult.error.message,
      supabaseDetails: timeBlocksResult.error.details,
      supabaseHint: timeBlocksResult.error.hint,
    });
  }

  return NextResponse.json({
    data: data ?? [],
    booking_slot_interval_min: bookingSlotIntervalMin,
    time_blocks: timeBlocks,
  });
}
