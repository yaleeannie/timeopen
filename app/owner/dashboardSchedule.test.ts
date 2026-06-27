import assert from "node:assert/strict";
import test from "node:test";
import {
  filterDashboardScheduleReservations,
  isDashboardScheduleStatus,
} from "./dashboardSchedule";

test("dashboard schedule includes requested, confirmed, and legacy null statuses", () => {
  assert.equal(isDashboardScheduleStatus("requested"), true);
  assert.equal(isDashboardScheduleStatus("confirmed"), true);
  assert.equal(isDashboardScheduleStatus(null), true);
  assert.equal(isDashboardScheduleStatus(undefined), true);
});

test("dashboard schedule excludes cancelled and canceled reservations", () => {
  assert.equal(isDashboardScheduleStatus("cancelled"), false);
  assert.equal(isDashboardScheduleStatus("canceled"), false);
});

test("dashboard schedule filter removes cancelled reservations from counts and lists", () => {
  const reservations = [
    { id: "requested", status: "requested" },
    { id: "confirmed", status: "confirmed" },
    { id: "legacy", status: null },
    { id: "cancelled", status: "cancelled" },
    { id: "canceled", status: "canceled" },
  ];

  assert.deepEqual(
    filterDashboardScheduleReservations(reservations).map((reservation) => reservation.id),
    ["requested", "confirmed", "legacy"]
  );
});
