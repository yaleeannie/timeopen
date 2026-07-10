import assert from "node:assert/strict";
import test from "node:test";

import { SLOT_INTERVAL_MINUTES } from "@/features/availability/slotInterval";
import {
  getBookingSlotStepMinutes,
  normalizeBookingSlotInterval,
  normalizeBookingSlotMode,
  validateBookingSlotInterval,
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

test("defaults booking slot interval to 10 minutes", () => {
  assert.equal(normalizeBookingSlotInterval(null), SLOT_INTERVAL_MINUTES);
  assert.equal(normalizeBookingSlotInterval(undefined), SLOT_INTERVAL_MINUTES);
  assert.equal(normalizeBookingSlotInterval("unknown"), SLOT_INTERVAL_MINUTES);
});

test("validates supported booking slot intervals", () => {
  for (const value of [10, 15, 30, 60]) {
    assert.deepEqual(validateBookingSlotInterval(value), {
      ok: true,
      value,
    });
    assert.deepEqual(validateBookingSlotInterval(String(value)), {
      ok: true,
      value,
    });
  }

  assert.equal(validateBookingSlotInterval(20).ok, false);
  assert.equal(validateBookingSlotInterval(0).ok, false);
});

test("flexible mode uses the configured interval with 10-minute fallback", () => {
  assert.equal(
    getBookingSlotStepMinutes({
      mode: "flexible",
      durationMin: 90,
      cleanupMin: 10,
    }),
    SLOT_INTERVAL_MINUTES
  );
  assert.equal(
    getBookingSlotStepMinutes({
      mode: "flexible",
      durationMin: 90,
      cleanupMin: 10,
      intervalMin: 30,
    }),
    30
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
