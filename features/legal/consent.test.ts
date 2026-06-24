import assert from "node:assert/strict";
import test from "node:test";

import {
  LEGAL_TERMS_VERSION,
  PRIVACY_POLICY_VERSION,
  buildCustomerPrivacyConsentPayload,
  buildOwnerLegalConsentMetadata,
  canSubmitCustomerReservation,
} from "./consent";

test("builds owner legal consent metadata with current legal versions", () => {
  assert.deepEqual(
    buildOwnerLegalConsentMetadata({
      nowISO: "2026-06-24T01:02:03.000Z",
      marketingAgreed: true,
    }),
    {
      terms_agreed_at: "2026-06-24T01:02:03.000Z",
      privacy_agreed_at: "2026-06-24T01:02:03.000Z",
      marketing_agreed_at: "2026-06-24T01:02:03.000Z",
      legal_terms_version: LEGAL_TERMS_VERSION,
      privacy_policy_version: PRIVACY_POLICY_VERSION,
    }
  );
});

test("builds customer privacy consent payload only when agreed", () => {
  assert.deepEqual(
    buildCustomerPrivacyConsentPayload({
      agreed: true,
      nowISO: "2026-06-24T01:02:03.000Z",
    }),
    {
      ok: true,
      customer_privacy_agreed_at: "2026-06-24T01:02:03.000Z",
      customer_privacy_policy_version: PRIVACY_POLICY_VERSION,
    }
  );

  assert.deepEqual(buildCustomerPrivacyConsentPayload({ agreed: false }), {
    ok: false,
    error: "개인정보 수집·이용에 동의해 주세요.",
  });
});

test("customer reservation submit is gated by privacy consent", () => {
  assert.equal(
    canSubmitCustomerReservation({
      hasSelection: true,
      hasValidName: true,
      hasPhone: true,
      customerPrivacyAgreed: false,
    }),
    false
  );

  assert.equal(
    canSubmitCustomerReservation({
      hasSelection: true,
      hasValidName: true,
      hasPhone: true,
      customerPrivacyAgreed: true,
    }),
    true
  );
});
