import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  getReservationStatusFilterEmptyText,
  isScheduleReservationStatus,
  matchesReservationStatusFilter,
  normalizeReservationStatusFilter,
  normalizeReservationView,
  RESERVATION_STATUS_FILTERS,
  RESERVATION_VIEW_TABS,
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

test("reservation management view tabs render with Korean labels", () => {
  assert.deepEqual(
    RESERVATION_VIEW_TABS.map((tab) => tab.label),
    ["일정 관리", "예약 현황"]
  );
});

test("reservation management view defaults to calendar", () => {
  assert.equal(normalizeReservationView("calendar"), "calendar");
  assert.equal(normalizeReservationView("list"), "list");
  assert.equal(normalizeReservationView("unknown"), "calendar");
});

test("calendar schedule statuses include only requested and confirmed", () => {
  assert.equal(isScheduleReservationStatus("requested"), true);
  assert.equal(isScheduleReservationStatus("confirmed"), true);
  assert.equal(isScheduleReservationStatus("cancelled"), false);
  assert.equal(isScheduleReservationStatus("canceled"), false);
  assert.equal(isScheduleReservationStatus(null), false);
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

test("top-level reservation view tabs render above the calendar for manual mode", () => {
  const tabsIndex = reservationsPage.indexOf('aria-label="예약관리 보기"');
  const calendarIndex = reservationsPage.indexOf('aria-label="예약 날짜 선택"');
  assert.ok(tabsIndex > -1);
  assert.ok(calendarIndex > -1);
  assert.ok(tabsIndex < calendarIndex);
});

test("automatic confirmation mode hides top-level reservation view tabs", () => {
  assert.match(
    reservationsPage,
    /const isManualConfirmationMode = bookingConfirmationMode === "manual"/
  );
  assert.match(
    reservationsPage,
    /\{isManualConfirmationMode \? \(\s+<nav\s+className="mb-4 grid grid-cols-2/s
  );
  assert.match(
    reservationsPage,
    /const selectedView = isManualConfirmationMode\s+\? normalizeReservationView\(searchParams\?\.view\)\s+: "calendar"/s
  );
});

test("reservation page falls back to automatic confirmation mode", () => {
  assert.match(
    reservationsPage,
    /function normalizeBookingConfirmationMode\(value: unknown\)/
  );
  assert.match(
    reservationsPage,
    /return value === "manual" \? "manual" : "automatic"/
  );
});

test("list view renders status tabs and calendar view renders calendar", () => {
  const listConditionIndex = reservationsPage.indexOf('selectedView === "list"');
  const statusTabsIndex = reservationsPage.indexOf('aria-label="예약 상태 필터"');
  const calendarIndex = reservationsPage.indexOf('aria-label="예약 날짜 선택"');
  assert.ok(listConditionIndex > -1);
  assert.ok(statusTabsIndex > listConditionIndex);
  assert.ok(calendarIndex > statusTabsIndex);
});

test("list view reservations are sorted by created_at desc", () => {
  assert.match(
    reservationsPage,
    /\[\.\.\.listReservationRows\]\.sort\(\(a, b\) =>\s+\(\(b\.row\.created_at/s
  );
});

test("calendar view includes only schedule statuses and sorts by start time", () => {
  assert.match(
    reservationsPage,
    /const calendarReservationRows = reservationRows\.filter\(\(\{ row \}\) =>\s+isScheduleReservationStatus\(row\.status\)/s
  );
  assert.match(
    reservationsPage,
    /\[\.\.\.calendarListReservations\]\.sort\(\(a, b\) =>\s+\(a\.start === "-"/s
  );
});

test("calendar count badges use schedule reservations only", () => {
  assert.match(
    reservationsPage,
    /const reservationCountByDate = calendarReservationRows\.reduce/
  );
});
