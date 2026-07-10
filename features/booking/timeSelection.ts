import type { BookingSlotMode } from "./slotMode";
import { normalizeBookingSlotInterval } from "./slotMode";

export function buildBookingTimeSelectionKey(input: {
  organizationId: string | null | undefined;
  dateISO: string | null | undefined;
  serviceId: string | null | undefined;
  bookingSlotMode: BookingSlotMode;
  bookingSlotIntervalMin?: number | null | undefined;
  durationMin: number | null | undefined;
  cleanupMin: number | null | undefined;
}) {
  const {
    organizationId,
    dateISO,
    serviceId,
    bookingSlotMode,
    bookingSlotIntervalMin,
    durationMin,
    cleanupMin,
  } = input;

  if (!organizationId || !dateISO || !serviceId || !durationMin) return null;

  return [
    organizationId,
    dateISO,
    serviceId,
    bookingSlotMode,
    normalizeBookingSlotInterval(bookingSlotIntervalMin),
    durationMin,
    cleanupMin ?? 0,
  ].join("_");
}

export function getEarliestAvailableTime(times: string[]) {
  return times[0] ?? null;
}

export function shouldShowEarliestTimeHint(input: {
  times: string[];
  selectedTime: string | null | undefined;
}) {
  const earliestTime = getEarliestAvailableTime(input.times);
  if (!earliestTime) return false;

  return input.selectedTime == null || input.selectedTime === earliestTime;
}
