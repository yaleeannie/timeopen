import { SLOT_INTERVAL_MINUTES } from "@/features/availability/slotInterval";

export const BOOKING_SLOT_MODES = ["flexible", "service_duration"] as const;

export type BookingSlotMode = (typeof BOOKING_SLOT_MODES)[number];

export function normalizeBookingSlotMode(value: unknown): BookingSlotMode {
  return value === "service_duration" ? "service_duration" : "flexible";
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

export function getBookingSlotStepMinutes(params: {
  mode: BookingSlotMode;
  durationMin: number;
  cleanupMin: number;
}) {
  if (params.mode === "service_duration") {
    return params.durationMin + params.cleanupMin;
  }

  return SLOT_INTERVAL_MINUTES;
}
