import type { BookingSlotMode } from "./slotMode";

export function buildBookingTimeSelectionKey(input: {
  organizationId: string | null | undefined;
  dateISO: string | null | undefined;
  serviceId: string | null | undefined;
  bookingSlotMode: BookingSlotMode;
  durationMin: number | null | undefined;
  cleanupMin: number | null | undefined;
}) {
  const { organizationId, dateISO, serviceId, bookingSlotMode, durationMin, cleanupMin } =
    input;

  if (!organizationId || !dateISO || !serviceId || !durationMin) return null;

  return [
    organizationId,
    dateISO,
    serviceId,
    bookingSlotMode,
    durationMin,
    cleanupMin ?? 0,
  ].join("_");
}

export function getEarliestAvailableTime(times: string[]) {
  return times[0] ?? null;
}
