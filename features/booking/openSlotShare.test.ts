import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOpenSlotShareMessage,
  formatOpenSlotTime,
} from "./openSlotShare";

test("formats 24-hour times as compact 12-hour times", () => {
  assert.equal(formatOpenSlotTime("15:00"), "3:00");
  assert.equal(formatOpenSlotTime("09:10"), "9:10");
  assert.equal(formatOpenSlotTime("00:00"), "12:00");
  assert.equal(formatOpenSlotTime("12:30"), "12:30");
});

test("builds a message for an open slot today", () => {
  assert.equal(
    buildOpenSlotShareMessage({
      dateISO: "2026-06-23",
      time: "15:00",
      bookingUrl: "https://timeopen.app/u/jisu-nail",
      todayISO: "2026-06-23",
    }),
    [
      "오늘 3:00 예약 가능해요 ✨",
      "예약은 여기서 해주세요:",
      "https://timeopen.app/u/jisu-nail",
    ].join("\n")
  );
});

test("builds a dated message and appends an optional note", () => {
  assert.equal(
    buildOpenSlotShareMessage({
      dateISO: "2026-06-28",
      time: "15:00",
      note: "젤네일 가능해요",
      bookingUrl: "https://timeopen.app/u/jisu-nail",
      todayISO: "2026-06-23",
    }),
    [
      "6월 28일 3:00 예약 가능해요 ✨",
      "젤네일 가능해요",
      "예약은 여기서 해주세요:",
      "https://timeopen.app/u/jisu-nail",
    ].join("\n")
  );
});
