export type SupportedPhoneCountry = "KR" | "JP" | "US" | "CA" | "TH" | "CN";

export type NormalizePhoneResult =
  | { ok: true; e164: string }
  | { ok: false; error: "INVALID_PHONE" };

type CountryRule = {
  callingCode: string;
  allowsTrunkZero: boolean;
  isValidNationalNumber: (digits: string) => boolean;
};

const COUNTRY_RULES: Record<SupportedPhoneCountry, CountryRule> = {
  KR: {
    callingCode: "82",
    allowsTrunkZero: true,
    isValidNationalNumber: (digits) => /^(?:10\d{8}|1[16789]\d{7,8})$/.test(digits),
  },
  JP: {
    callingCode: "81",
    allowsTrunkZero: true,
    isValidNationalNumber: (digits) => /^(?:70|80|90)\d{8}$/.test(digits),
  },
  US: {
    callingCode: "1",
    allowsTrunkZero: false,
    isValidNationalNumber: (digits) => /^[2-9]\d{2}[2-9]\d{6}$/.test(digits),
  },
  CA: {
    callingCode: "1",
    allowsTrunkZero: false,
    isValidNationalNumber: (digits) => /^[2-9]\d{2}[2-9]\d{6}$/.test(digits),
  },
  TH: {
    callingCode: "66",
    allowsTrunkZero: true,
    isValidNationalNumber: (digits) => /^[689]\d{8}$/.test(digits),
  },
  CN: {
    callingCode: "86",
    allowsTrunkZero: false,
    isValidNationalNumber: (digits) => /^1[3-9]\d{9}$/.test(digits),
  },
};

const INVALID_PHONE: NormalizePhoneResult = {
  ok: false,
  error: "INVALID_PHONE",
};

function removeAllowedSeparators(value: string) {
  return value.replace(/[\s()-]/g, "");
}

function removeTrunkZero(digits: string, rule: CountryRule) {
  if (rule.allowsTrunkZero && digits.startsWith("0")) {
    return digits.slice(1);
  }

  return digits;
}

export function normalizePhoneToE164(
  country: SupportedPhoneCountry,
  rawPhone: string
): NormalizePhoneResult {
  const rule = COUNTRY_RULES[country];
  const trimmed = rawPhone.trim();

  if (!trimmed || !/^[+\d\s()-]+$/.test(trimmed)) {
    return INVALID_PHONE;
  }

  const compact = removeAllowedSeparators(trimmed);
  const plusCount = (compact.match(/\+/g) ?? []).length;

  if (plusCount > 1 || (plusCount === 1 && !compact.startsWith("+"))) {
    return INVALID_PHONE;
  }

  let nationalNumber: string;

  if (compact.startsWith("+")) {
    const internationalDigits = compact.slice(1);

    if (
      !/^\d+$/.test(internationalDigits) ||
      !internationalDigits.startsWith(rule.callingCode)
    ) {
      return INVALID_PHONE;
    }

    nationalNumber = removeTrunkZero(
      internationalDigits.slice(rule.callingCode.length),
      rule
    );
  } else {
    if (!/^\d+$/.test(compact)) {
      return INVALID_PHONE;
    }

    const countryCodeCandidate = compact.startsWith(rule.callingCode)
      ? removeTrunkZero(compact.slice(rule.callingCode.length), rule)
      : null;

    nationalNumber =
      countryCodeCandidate && rule.isValidNationalNumber(countryCodeCandidate)
        ? countryCodeCandidate
        : removeTrunkZero(compact, rule);
  }

  if (!rule.isValidNationalNumber(nationalNumber)) {
    return INVALID_PHONE;
  }

  const e164 = `+${rule.callingCode}${nationalNumber}`;

  if (e164.length > 16) {
    return INVALID_PHONE;
  }

  return { ok: true, e164 };
}
