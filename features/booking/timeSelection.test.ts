import assert from "node:assert/strict";
import test from "node:test";

import {
  buildBookingTimeSelectionKey,
  getEarliestAvailableTime,
  shouldShowEarliestTimeHint,
} from "./timeSelection";

test("builds the same stable key shape for time slot readiness", () => {
  assert.equal(
    buildBookingTimeSelectionKey({
      organizationId: "org-1",
      dateISO: "2026-06-24",
      serviceId: "svc-1",
      bookingSlotMode: "flexible",
      durationMin: 90,
      cleanupMin: 10,
    }),
    "org-1_2026-06-24_svc-1_flexible_90_10"
  );
});

test("time selection key changes for service-duration mode inputs", () => {
  assert.notEqual(
    buildBookingTimeSelectionKey({
      organizationId: "org-1",
      dateISO: "2026-06-24",
      serviceId: "svc-1",
      bookingSlotMode: "flexible",
      durationMin: 90,
      cleanupMin: 10,
    }),
    buildBookingTimeSelectionKey({
      organizationId: "org-1",
      dateISO: "2026-06-24",
      serviceId: "svc-1",
      bookingSlotMode: "service_duration",
      durationMin: 90,
      cleanupMin: 10,
    })
  );
});

test("time selection key is null until required values exist", () => {
  assert.equal(
    buildBookingTimeSelectionKey({
      organizationId: "org-1",
      dateISO: null,
      serviceId: "svc-1",
      bookingSlotMode: "flexible",
      durationMin: 90,
      cleanupMin: 0,
    }),
    null
  );
});

test("returns only the first available time as the earliest helper target", () => {
  assert.equal(getEarliestAvailableTime(["09:00", "09:10", "09:20"]), "09:00");
  assert.equal(getEarliestAvailableTime([]), null);
});

test("shows earliest hint before selecting a non-earliest time", () => {
  assert.equal(
    shouldShowEarliestTimeHint({
      times: ["09:00", "09:10", "09:20"],
      selectedTime: null,
    }),
    true
  );

  assert.equal(
    shouldShowEarliestTimeHint({
      times: ["09:00", "09:10", "09:20"],
      selectedTime: "09:00",
    }),
    true
  );
});

test("hides earliest hint after selecting a non-earliest time", () => {
  assert.equal(
    shouldShowEarliestTimeHint({
      times: ["09:00", "09:10", "09:20"],
      selectedTime: "09:10",
    }),
    false
  );

  assert.equal(
    shouldShowEarliestTimeHint({
      times: [],
      selectedTime: null,
    }),
    false
  );
});
