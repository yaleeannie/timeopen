import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getReservationStatusFilterEmptyText,
  isReservationStatusFilterCalendarScoped,
  matchesReservationStatusFilter,
  normalizeReservationStatusFilter,
  RESERVATION_STATUS_FILTERS,
} from "./statusFilters";

const reservationsPage = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8"
);

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
  assert.equal(matchesReservationStatusFilter("cancelled", "all"), false);
  assert.equal(matchesReservationStatusFilter("canceled", "all"), false);
});

test("reservation status filter normalizes query values", () => {
  assert.equal(normalizeReservationStatusFilter("requested"), "requested");
  assert.equal(normalizeReservationStatusFilter("confirmed"), "confirmed");
  assert.equal(normalizeReservationStatusFilter("cancelled"), "cancelled");
  assert.equal(normalizeReservationStatusFilter("canceled"), "all");
  assert.equal(normalizeReservationStatusFilter("unknown"), "all");
});

test("reservation status filters define which views are calendar scoped", () => {
  assert.equal(isReservationStatusFilterCalendarScoped("all"), true);
  assert.equal(isReservationStatusFilterCalendarScoped("confirmed"), true);
  assert.equal(isReservationStatusFilterCalendarScoped("requested"), false);
  assert.equal(isReservationStatusFilterCalendarScoped("cancelled"), false);
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

test("reservation status tabs render above the calendar", () => {
  const tabsIndex = reservationsPage.indexOf('aria-label="예약 상태 필터"');
  const calendarIndex = reservationsPage.indexOf('aria-label="예약 날짜 선택"');
  assert.ok(tabsIndex > -1);
  assert.ok(calendarIndex > -1);
  assert.ok(tabsIndex < calendarIndex);
});

test("pending and cancelled filters are not limited to the selected date", () => {
  assert.match(reservationsPage, /const calendarScoped = isReservationStatusFilterCalendarScoped/);
  assert.match(reservationsPage, /calendarScoped\s+\?\s+selectedReservations\.filter/s);
  assert.match(reservationsPage, /:\s+\[\.\.\.filteredReservationRows\]\.sort/s);
});

test("calendar count badges use the selected status filter", () => {
  assert.match(
    reservationsPage,
    /const reservationCountByDate = filteredReservationRows\.reduce/
  );
});
