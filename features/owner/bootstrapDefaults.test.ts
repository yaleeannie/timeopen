import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_BOOKING_SLOT_MODE,
  DEFAULT_OWNER_ORGANIZATION_NAME,
  DEFAULT_PLAN_TYPE,
  DEFAULT_SUBSCRIPTION_STATUS,
  getDefaultOwnerOrganizationPayload,
} from "./bootstrapDefaults";

test("builds safe default owner organization payload for beta users", () => {
  assert.deepEqual(getDefaultOwnerOrganizationPayload("my-shop"), {
    handle: "my-shop",
    name: DEFAULT_OWNER_ORGANIZATION_NAME,
    plan: "trial",
    plan_type: DEFAULT_PLAN_TYPE,
    subscription_status: DEFAULT_SUBSCRIPTION_STATUS,
    booking_slot_mode: DEFAULT_BOOKING_SLOT_MODE,
  });
});
