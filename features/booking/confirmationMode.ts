export const BOOKING_CONFIRMATION_MODES = ["manual", "automatic"] as const;

export type BookingConfirmationMode =
  (typeof BOOKING_CONFIRMATION_MODES)[number];

export function normalizeBookingConfirmationMode(value: unknown): BookingConfirmationMode {
  return value === "manual" ? "manual" : "automatic";
}

export function validateBookingConfirmationMode(value: unknown) {
  if (value === "manual" || value === "automatic") {
    return { ok: true as const, value };
  }

  return {
    ok: false as const,
    error: "예약 확정 방식을 선택해주세요.",
  };
}
