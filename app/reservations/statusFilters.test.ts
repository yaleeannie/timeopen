import assert from "node:assert/strict";
import test from "node:test";
import {
  getReservationStatusFilterEmptyText,
  matchesReservationStatusFilter,
  RESERVATION_STATUS_FILTERS,
} from "./statusFilters";

test("reservation status tabs render with Korean labels", () => {
  assert.deepEqual(
    RESERVATION_STATUS_FILTERS.map((filter) => filter.label),
    ["전체", "확인 대기", "확인 완료", "취소"]
  );
});

test("reservation status filters match expected statuses", () => {
  assert.equal(matchesReservationStatusFilter("requested", "requested"), true);
  assert.equal(matchesReservationStatusFilter("confirmed", "requested"), false);
  assert.equal(matchesReservationStatusFilter("confirmed", "confirmed"), true);
  assert.equal(matchesReservationStatusFilter("cancelled", "cancelled"), true);
  assert.equal(matchesReservationStatusFilter("canceled", "cancelled"), true);
  assert.equal(matchesReservationStatusFilter("requested", "all"), true);
  assert.equal(matchesReservationStatusFilter("confirmed", "all"), true);
});

test("reservation status filter empty states are explicit", () => {
  assert.equal(
    getReservationStatusFilterEmptyText("requested"),
    "확인 대기 중인 예약이 없어요."
  );
  assert.equal(
    getReservationStatusFilterEmptyText("confirmed"),
    "확인 완료된 예약이 없어요."
  );
  assert.equal(
    getReservationStatusFilterEmptyText("cancelled"),
    "취소된 예약이 없어요."
  );
  assert.equal(getReservationStatusFilterEmptyText("all"), "아직 예약이 없어요.");
});
