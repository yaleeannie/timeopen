export const LEGAL_TERMS_VERSION = "2026-06-24";
export const PRIVACY_POLICY_VERSION = "2026-06-24";

export function buildOwnerLegalConsentMetadata(input: {
  nowISO: string;
  marketingAgreed: boolean;
}) {
  return {
    terms_agreed_at: input.nowISO,
    privacy_agreed_at: input.nowISO,
    marketing_agreed_at: input.marketingAgreed ? input.nowISO : null,
    legal_terms_version: LEGAL_TERMS_VERSION,
    privacy_policy_version: PRIVACY_POLICY_VERSION,
  };
}

export function buildCustomerPrivacyConsentPayload(input: {
  agreed: boolean;
  nowISO?: string;
}) {
  if (!input.agreed) {
    return {
      ok: false as const,
      error: "개인정보 수집·이용에 동의해 주세요.",
    };
  }

  return {
    ok: true as const,
    customer_privacy_agreed_at: input.nowISO ?? new Date().toISOString(),
    customer_privacy_policy_version: PRIVACY_POLICY_VERSION,
  };
}

export function canSubmitCustomerReservation(input: {
  hasSelection: boolean;
  hasValidName: boolean;
  hasPhone: boolean;
  customerPrivacyAgreed: boolean;
}) {
  return (
    input.hasSelection &&
    input.hasValidName &&
    input.hasPhone &&
    input.customerPrivacyAgreed
  );
}
