import assert from "node:assert/strict";
import test from "node:test";
import {
  FIELD_LIMITS,
  validateHandleValue,
  validateServiceInput,
} from "./fieldLimits";

test("validates service description max length", () => {
  const valid = validateServiceInput({
    name: "젤네일",
    description: "a".repeat(FIELD_LIMITS.serviceDescriptionMax),
    durationMin: 60,
    price: 50000,
  });
  assert.equal(valid.ok, true);

  const invalid = validateServiceInput({
    name: "젤네일",
    description: "a".repeat(FIELD_LIMITS.serviceDescriptionMax + 1),
    durationMin: 60,
    price: 50000,
  });
  assert.equal(invalid.ok, false);
});

test("validates service duration and price bounds", () => {
  assert.equal(
    validateServiceInput({ name: "케어", durationMin: 4, price: 10000 }).ok,
    false
  );
  assert.equal(
    validateServiceInput({ name: "케어", durationMin: 481, price: 10000 }).ok,
    false
  );
  assert.equal(
    validateServiceInput({ name: "케어", durationMin: 30, price: -1 }).ok,
    false
  );
  assert.equal(
    validateServiceInput({ name: "케어", durationMin: 30, price: 10_000_000 }).ok,
    false
  );
  assert.equal(
    validateServiceInput({ name: "케어", durationMin: 30, price: 9_999_999 }).ok,
    true
  );
  assert.equal(
    validateServiceInput({
      name: "케어",
      durationMin: 30,
      hasPrice: false,
      priceRequired: true,
      price: null,
    }).ok,
    false
  );
});

test("validates handles with underscores and 3 to 30 characters", () => {
  assert.deepEqual(validateHandleValue("my_shop-01"), {
    ok: true,
    value: "my_shop-01",
  });
  assert.equal(validateHandleValue("ab").ok, false);
  assert.equal(validateHandleValue("a".repeat(31)).ok, false);
  assert.equal(validateHandleValue("My Shop").ok, false);
});
