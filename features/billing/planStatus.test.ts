import assert from "node:assert/strict";
import test from "node:test";
import {
  getPlanDisplay,
  isPlanType,
  isSubscriptionStatus,
  normalizePlanType,
} from "./planStatus";

test("returns beta display copy by default", () => {
  const display = getPlanDisplay({});
  assert.equal(display.planType, "beta");
  assert.equal(display.label, "베타 이용 중");
  assert.match(display.helperText, /무료로 사용할 수 있어요/);
  assert.match(display.billingNotice, /자동 결제되지 않아요/);
});

test("returns labels for supported plan types", () => {
  assert.equal(getPlanDisplay({ plan_type: "trial" }).label, "무료 체험 중");
  assert.equal(getPlanDisplay({ plan_type: "paid" }).label, "유료 이용 중");
  assert.equal(getPlanDisplay({ plan_type: "free" }).label, "무료 플랜");
  assert.equal(getPlanDisplay({ plan_type: "canceled" }).label, "이용 종료");
});

test("validates supported plan and subscription statuses", () => {
  assert.equal(isPlanType("beta"), true);
  assert.equal(isPlanType("enterprise"), false);
  assert.equal(isSubscriptionStatus("trialing"), true);
  assert.equal(isSubscriptionStatus("paused"), false);
  assert.equal(normalizePlanType("unknown"), "beta");
});
