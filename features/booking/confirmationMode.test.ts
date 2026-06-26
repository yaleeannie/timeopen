import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeBookingConfirmationMode,
  validateBookingConfirmationMode,
} from "./confirmationMode";

test("booking confirmation mode defaults to automatic for unknown values", () => {
  assert.equal(normalizeBookingConfirmationMode(null), "automatic");
  assert.equal(normalizeBookingConfirmationMode(""), "automatic");
  assert.equal(normalizeBookingConfirmationMode("legacy"), "automatic");
});

test("booking confirmation mode accepts automatic and manual only", () => {
  assert.deepEqual(validateBookingConfirmationMode("automatic"), {
    ok: true,
    value: "automatic",
  });
  assert.deepEqual(validateBookingConfirmationMode("manual"), {
    ok: true,
    value: "manual",
  });
  assert.equal(validateBookingConfirmationMode("requested").ok, false);
});
