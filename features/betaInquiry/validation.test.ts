import assert from "node:assert/strict";
import test from "node:test";
import {
  BETA_INQUIRY_LIMITS,
  validateBetaInquiry,
} from "./validation";

const validInput = {
  name: "김사장",
  contact: "@nail_shop",
  shop_name: "타임네일",
  shop_type: "네일샵",
  current_booking_method: "인스타 DM",
  pain_point: "시간 조율",
  monthly_booking_volume: "30~100건",
  message: "베타 안내 부탁드려요.",
};

test("validates a beta partner inquiry", () => {
  const result = validateBetaInquiry(validInput);
  assert.equal(result.ok, true);
});

test("rejects beta inquiry fields over length limits", () => {
  assert.equal(
    validateBetaInquiry({
      ...validInput,
      name: "가".repeat(BETA_INQUIRY_LIMITS.nameMax + 1),
    }).ok,
    false
  );
  assert.equal(
    validateBetaInquiry({
      ...validInput,
      message: "가".repeat(BETA_INQUIRY_LIMITS.messageMax + 1),
    }).ok,
    false
  );
});

test("rejects unsupported beta inquiry options", () => {
  assert.equal(
    validateBetaInquiry({
      ...validInput,
      shop_type: "식당",
    }).ok,
    false
  );
});
