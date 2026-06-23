export const FIELD_LIMITS = {
  shopNameMax: 30,
  noticeMax: 200,
  serviceNameMax: 30,
  serviceDescriptionMax: 120,
  serviceDurationMin: 5,
  serviceDurationMax: 480,
  servicePriceMin: 0,
  servicePriceMax: 9_999_999,
  customerNameMax: 30,
  customerRequestMax: 300,
  handleMin: 3,
  handleMax: 30,
} as const;

export function normalizeHandleValue(value: string) {
  return value.trim().toLowerCase();
}

export function isValidHandleValue(value: string) {
  return /^[a-z0-9_-]{3,30}$/.test(value);
}

export function validateHandleValue(value: string) {
  const handle = normalizeHandleValue(value);

  if (!handle) {
    return { ok: false as const, error: "인스타 예약 링크 주소를 입력해주세요." };
  }

  if (!isValidHandleValue(handle)) {
    return {
      ok: false as const,
      error: "인스타 예약 링크 주소는 영어 소문자, 숫자, 하이픈(-), 언더스코어(_)를 사용해 3~30자로 입력해주세요.",
    };
  }

  return { ok: true as const, value: handle };
}

export function validateShopName(value: string) {
  const name = value.trim();

  if (!name) {
    return { ok: false as const, error: "매장 이름을 입력해주세요." };
  }

  if (name.length > FIELD_LIMITS.shopNameMax) {
    return {
      ok: false as const,
      error: `매장 이름은 최대 ${FIELD_LIMITS.shopNameMax}자까지 입력할 수 있어요.`,
    };
  }

  return { ok: true as const, value: name };
}

export function validateOptionalText(value: string, max: number, label: string) {
  const text = value.trim();

  if (text.length > max) {
    return {
      ok: false as const,
      error: `${label}은 최대 ${max}자까지 입력할 수 있어요.`,
    };
  }

  return { ok: true as const, value: text };
}

export function validateCustomerName(value: string) {
  const name = value.trim();

  if (!name) {
    return { ok: false as const, error: "이름을 입력해주세요." };
  }

  if (name.length > FIELD_LIMITS.customerNameMax) {
    return {
      ok: false as const,
      error: `이름은 최대 ${FIELD_LIMITS.customerNameMax}자까지 입력할 수 있어요.`,
    };
  }

  return { ok: true as const, value: name };
}

export function validateServiceInput(input: {
  name: string;
  description?: string | null;
  durationMin: number;
  hasPrice?: boolean;
  priceRequired?: boolean;
  price?: number | null;
}) {
  const name = input.name.trim();
  const description = (input.description ?? "").trim();
  const price = input.price ?? null;
  const numericPrice = typeof price === "number" ? price : Number.NaN;

  if (!name) {
    return { ok: false as const, error: "서비스명을 입력해주세요." };
  }

  if (name.length > FIELD_LIMITS.serviceNameMax) {
    return {
      ok: false as const,
      error: `서비스명은 최대 ${FIELD_LIMITS.serviceNameMax}자까지 입력할 수 있어요.`,
    };
  }

  if (description.length > FIELD_LIMITS.serviceDescriptionMax) {
    return {
      ok: false as const,
      error: `서비스 설명은 최대 ${FIELD_LIMITS.serviceDescriptionMax}자까지 입력할 수 있어요.`,
    };
  }

  if (
    !Number.isInteger(input.durationMin) ||
    input.durationMin < FIELD_LIMITS.serviceDurationMin ||
    input.durationMin > FIELD_LIMITS.serviceDurationMax
  ) {
    return {
      ok: false as const,
      error: `소요 시간은 ${FIELD_LIMITS.serviceDurationMin}분 이상 ${FIELD_LIMITS.serviceDurationMax}분 이하로 입력해주세요.`,
    };
  }

  if (input.priceRequired && input.hasPrice === false) {
    return {
      ok: false as const,
      error: `가격은 ${FIELD_LIMITS.servicePriceMin.toLocaleString()}원 이상 ${FIELD_LIMITS.servicePriceMax.toLocaleString()}원 이하로 입력해주세요.`,
    };
  }

  if (
    input.hasPrice !== false &&
    (!Number.isFinite(numericPrice) ||
      numericPrice < FIELD_LIMITS.servicePriceMin ||
      numericPrice > FIELD_LIMITS.servicePriceMax)
  ) {
    return {
      ok: false as const,
      error: `가격은 ${FIELD_LIMITS.servicePriceMin.toLocaleString()}원 이상 ${FIELD_LIMITS.servicePriceMax.toLocaleString()}원 이하로 입력해주세요.`,
    };
  }

  return {
    ok: true as const,
    value: {
      name,
      description,
      durationMin: input.durationMin,
      price: input.hasPrice === false ? null : numericPrice,
    },
  };
}
