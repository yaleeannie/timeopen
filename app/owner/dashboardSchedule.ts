export function isDashboardScheduleStatus(status: string | null | undefined) {
  const normalized = (status ?? "confirmed").trim().toLowerCase();
  return normalized !== "cancelled" && normalized !== "canceled";
}

export function filterDashboardScheduleReservations<
  T extends { status: string | null | undefined },
>(reservations: T[]) {
  return reservations.filter((reservation) =>
    isDashboardScheduleStatus(reservation.status)
  );
}
