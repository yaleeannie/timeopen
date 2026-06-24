import assert from "node:assert/strict";
import test from "node:test";

import {
  formatReservationDateCompactKorean,
  formatReservationDateKorean,
  formatReservationTimeDisplay,
  formatReservationTimeRangeDisplay,
} from "./reservationDisplay";

test("formats reservation time without seconds", () => {
  assert.equal(formatReservationTimeDisplay("11:20:00"), "11:20");
  assert.equal(formatReservationTimeDisplay("9:05:30"), "09:05");
  assert.equal(formatReservationTimeDisplay("18:40"), "18:40");
});

test("formats reservation time range without seconds", () => {
  assert.equal(
    formatReservationTimeRangeDisplay("11:20:00", "12:50:00"),
    "11:20 ~ 12:50"
  );
});

test("formats Korean reservation dates for confirmation and SMS", () => {
  assert.equal(formatReservationDateKorean("2026-06-24"), "2026년 6월 24일");
  assert.equal(formatReservationDateCompactKorean("2026-06-24"), "6월 24일");
});
