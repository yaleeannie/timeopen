import assert from "node:assert/strict";
import test from "node:test";

import { isBootstrapApiSuccess } from "./bootstrapResponse";
import { getOnboardingBootstrapState } from "./bootstrapState";

test("missing organization triggers onboarding bootstrap retry state", () => {
  assert.equal(
    getOnboardingBootstrapState({ userId: "user-1", organizationId: null }),
    "retry"
  );
});

test("existing organization keeps onboarding ready state", () => {
  assert.equal(
    getOnboardingBootstrapState({ userId: "user-1", organizationId: "org-1" }),
    "ready"
  );
});

test("bootstrap api success accepts null handle", () => {
  assert.equal(
    isBootstrapApiSuccess({
      ok: true,
      organizationId: "org-1",
      handle: null,
    }),
    true
  );
});

test("bootstrap api success requires organization id", () => {
  assert.equal(
    isBootstrapApiSuccess({
      ok: true,
      handle: null,
    }),
    false
  );
});
