export type ReservationStatusFilter = "all" | "requested" | "confirmed" | "cancelled";

export const RESERVATION_STATUS_FILTERS: Array<{
  value: ReservationStatusFilter;
  label: string;
}> = [
  { value: "all", label: "전체" },
  { value: "requested", label: "확인 대기" },
  { value: "confirmed", label: "확인 완료" },
  { value: "cancelled", label: "취소" },
];

export function normalizeReservationStatusFilter(
  value: unknown
): ReservationStatusFilter {
  return value === "requested" ||
    value === "confirmed" ||
    value === "cancelled"
    ? value
    : "all";
}

export function matchesReservationStatusFilter(
  status: string | null,
  filter: ReservationStatusFilter
) {
  if (filter === "all") return status !== "cancelled" && status !== "canceled";
  if (filter === "requested") return status === "requested";
  if (filter === "confirmed") return status === "confirmed";
  return status === "cancelled" || status === "canceled";
}

export function isReservationStatusFilterCalendarScoped(
  filter: ReservationStatusFilter
) {
  return filter === "all" || filter === "confirmed";
}

export function getReservationStatusFilterEmptyText(
  filter: ReservationStatusFilter
) {
  switch (filter) {
    case "requested":
      return "확인 대기 중인 예약이 없어요.";
    case "confirmed":
      return "확인 완료된 예약이 없어요.";
    case "cancelled":
      return "취소된 예약이 없어요.";
    default:
      return "아직 예약이 없어요.";
  }
}
