export const BETA_INQUIRY_LIMITS = {
  nameMax: 30,
  contactMax: 100,
  shopNameMax: 50,
  messageMax: 500,
} as const;

export const SHOP_TYPE_OPTIONS = [
  "네일샵",
  "속눈썹샵",
  "왁싱샵",
  "1인 미용실",
  "피부관리샵",
  "기타",
] as const;

export const BOOKING_METHOD_OPTIONS = [
  "인스타 DM",
  "카카오톡",
  "네이버 예약",
  "전화/문자",
  "수기 메모",
  "기타",
] as const;

export const PAIN_POINT_OPTIONS = [
  "시간 조율",
  "가격/서비스 설명 반복",
  "예약 누락",
  "외국인 고객 응대",
  "빈 시간 홍보",
  "고객 응답 지연",
  "기타",
] as const;

export const MONTHLY_BOOKING_VOLUME_OPTIONS = [
  "30건 미만",
  "30~100건",
  "100~300건",
  "300건 이상",
  "잘 모르겠음",
] as const;

type BetaInquiryInput = {
  name: unknown;
  contact: unknown;
  shop_name: unknown;
  shop_type: unknown;
  current_booking_method: unknown;
  pain_point: unknown;
  monthly_booking_volume: unknown;
  message: unknown;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function inOptions<T extends readonly string[]>(value: string, options: T): value is T[number] {
  return (options as readonly string[]).includes(value);
}

function validateRequiredText(value: string, max: number, label: string) {
  if (!value) {
    return `${label}을 입력해주세요.`;
  }

  if (value.length > max) {
    return `${label}은 최대 ${max}자까지 입력할 수 있어요.`;
  }

  return null;
}

function validateOptionalText(value: string, max: number, label: string) {
  if (value.length > max) {
    return `${label}은 최대 ${max}자까지 입력할 수 있어요.`;
  }

  return null;
}

export function validateBetaInquiry(input: BetaInquiryInput) {
  const name = asString(input.name);
  const contact = asString(input.contact);
  const shopName = asString(input.shop_name);
  const shopType = asString(input.shop_type);
  const currentBookingMethod = asString(input.current_booking_method);
  const painPoint = asString(input.pain_point);
  const monthlyBookingVolume = asString(input.monthly_booking_volume);
  const message = asString(input.message);

  const nameError = validateRequiredText(name, BETA_INQUIRY_LIMITS.nameMax, "이름");
  if (nameError) return { ok: false as const, error: nameError };

  const contactError = validateRequiredText(
    contact,
    BETA_INQUIRY_LIMITS.contactMax,
    "연락처"
  );
  if (contactError) return { ok: false as const, error: contactError };

  const shopNameError = validateOptionalText(
    shopName,
    BETA_INQUIRY_LIMITS.shopNameMax,
    "샵 이름"
  );
  if (shopNameError) return { ok: false as const, error: shopNameError };

  const messageError = validateOptionalText(
    message,
    BETA_INQUIRY_LIMITS.messageMax,
    "남기고 싶은 말"
  );
  if (messageError) return { ok: false as const, error: messageError };

  if (!inOptions(shopType, SHOP_TYPE_OPTIONS)) {
    return { ok: false as const, error: "샵 유형을 선택해주세요." };
  }

  if (!inOptions(currentBookingMethod, BOOKING_METHOD_OPTIONS)) {
    return { ok: false as const, error: "현재 예약 방식을 선택해주세요." };
  }

  if (!inOptions(painPoint, PAIN_POINT_OPTIONS)) {
    return { ok: false as const, error: "가장 불편한 점을 선택해주세요." };
  }

  if (!inOptions(monthlyBookingVolume, MONTHLY_BOOKING_VOLUME_OPTIONS)) {
    return { ok: false as const, error: "월 예약 규모를 선택해주세요." };
  }

  return {
    ok: true as const,
    value: {
      name,
      contact,
      shop_name: shopName || null,
      shop_type: shopType,
      current_booking_method: currentBookingMethod,
      pain_point: painPoint,
      monthly_booking_volume: monthlyBookingVolume,
      message: message || null,
    },
  };
}
