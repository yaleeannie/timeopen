import { SLOT_INTERVAL_MINUTES } from "@/features/availability/slotInterval";

export const BOOKING_SLOT_MODES = ["flexible", "service_duration"] as const;
export const BOOKING_SLOT_INTERVAL_OPTIONS = [10, 15, 30, 60] as const;

export type BookingSlotMode = (typeof BOOKING_SLOT_MODES)[number];
export type BookingSlotIntervalMinutes = (typeof BOOKING_SLOT_INTERVAL_OPTIONS)[number];

function parseBookingSlotInterval(value: unknown) {
  return typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : NaN;
}

export function normalizeBookingSlotMode(value: unknown): BookingSlotMode {
  return value === "service_duration" ? "service_duration" : "flexible";
}

export function normalizeBookingSlotInterval(value: unknown): BookingSlotIntervalMinutes {
  const numericValue = parseBookingSlotInterval(value);

  return BOOKING_SLOT_INTERVAL_OPTIONS.includes(numericValue as BookingSlotIntervalMinutes)
    ? (numericValue as BookingSlotIntervalMinutes)
    : SLOT_INTERVAL_MINUTES;
}

export function validateBookingSlotMode(value: unknown) {
  if (value !== "flexible" && value !== "service_duration") {
    return {
      ok: false as const,
      error: "예약 시간 표시 방식을 다시 선택해주세요.",
    };
  }

  return { ok: true as const, value };
}

export function validateBookingSlotInterval(value: unknown) {
  const numericValue = parseBookingSlotInterval(value);

  if (!BOOKING_SLOT_INTERVAL_OPTIONS.includes(numericValue as BookingSlotIntervalMinutes)) {
    return {
      ok: false as const,
      error: "예약 시간 단위를 다시 선택해주세요.",
    };
  }

  return { ok: true as const, value: numericValue as BookingSlotIntervalMinutes };
}

export function getBookingSlotStepMinutes(params: {
  mode: BookingSlotMode;
  durationMin: number;
  cleanupMin: number;
  intervalMin?: unknown;
}) {
  if (params.mode === "service_duration") {
    return params.durationMin + params.cleanupMin;
  }

  return normalizeBookingSlotInterval(params.intervalMin);
}
