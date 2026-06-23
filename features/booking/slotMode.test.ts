import assert from "node:assert/strict";
import test from "node:test";

import { SLOT_INTERVAL_MINUTES } from "@/features/availability/slotInterval";
import {
  getBookingSlotStepMinutes,
  normalizeBookingSlotMode,
  validateBookingSlotMode,
} from "./slotMode";

test("defaults booking slot mode to flexible", () => {
  assert.equal(normalizeBookingSlotMode(null), "flexible");
  assert.equal(normalizeBookingSlotMode("unknown"), "flexible");
});

test("validates supported booking slot modes", () => {
  assert.deepEqual(validateBookingSlotMode("flexible"), {
    ok: true,
    value: "flexible",
  });
  assert.deepEqual(validateBookingSlotMode("service_duration"), {
    ok: true,
    value: "service_duration",
  });
  assert.equal(validateBookingSlotMode("other").ok, false);
});

test("flexible mode uses the shared 10-minute interval", () => {
  assert.equal(
    getBookingSlotStepMinutes({
      mode: "flexible",
      durationMin: 90,
      cleanupMin: 10,
    }),
    SLOT_INTERVAL_MINUTES
  );
});

test("service_duration mode uses service duration plus cleanup", () => {
  assert.equal(
    getBookingSlotStepMinutes({
      mode: "service_duration",
      durationMin: 90,
      cleanupMin: 0,
    }),
    90
  );
  assert.equal(
    getBookingSlotStepMinutes({
      mode: "service_duration",
      durationMin: 90,
      cleanupMin: 10,
    }),
    100
  );
});
