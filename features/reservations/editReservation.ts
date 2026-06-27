import { validateCustomerName } from "@/features/validation/fieldLimits";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type ReservationEditInput = {
  reservationId: unknown;
  serviceId: unknown;
  customerName: unknown;
  customerPhone: unknown;
  date: unknown;
  startTime: unknown;
};

export type ReservationEditPayload = {
  p_reservation_id: string;
  p_service_id: string;
  p_customer_name: string;
  p_customer_phone: string;
  p_date: string;
  p_start: string;
};

export type ReservationEditValue = {
  reservationId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
};

export function validateReservationEditInput(input: ReservationEditInput) {
  const reservationId = asText(input.reservationId);
  if (!reservationId) {
    return { ok: false as const, error: "예약 ID가 필요합니다." };
  }

  const serviceId = asText(input.serviceId);
  if (!serviceId) {
    return { ok: false as const, error: "서비스를 선택해주세요." };
  }

  const customerName = validateCustomerName(asText(input.customerName));
  if (!customerName.ok) return customerName;

  const customerPhone = asText(input.customerPhone);
  if (!customerPhone) {
    return { ok: false as const, error: "연락처를 입력해주세요." };
  }
  if (customerPhone.length > 50) {
    return {
      ok: false as const,
      error: "연락처는 최대 50자까지 입력할 수 있어요.",
    };
  }

  const date = asText(input.date);
  if (!isValidDateOnly(date)) {
    return { ok: false as const, error: "예약 날짜를 올바르게 입력해주세요." };
  }

  const startTime = normalizeTime(asText(input.startTime));
  if (!startTime) {
    return { ok: false as const, error: "시작 시간을 올바르게 입력해주세요." };
  }

  return {
    ok: true as const,
    value: {
      reservationId,
      serviceId,
      customerName: customerName.value,
      customerPhone,
      date,
      startTime,
    },
  };
}

export function buildReservationEditRpcPayload(
  value: ReservationEditValue
): ReservationEditPayload {
  return {
    p_reservation_id: value.reservationId,
    p_service_id: value.serviceId,
    p_customer_name: value.customerName,
    p_customer_phone: value.customerPhone,
    p_date: value.date,
    p_start: value.startTime,
  };
}

export function buildReservationUpdatedSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  bookingContact?: string;
}) {
  const shopName = params.shopName?.trim();
  const lines = [
    shopName ? `${shopName} 예약 정보가 변경되었어요.` : "예약 정보가 변경되었어요.",
    "",
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
  ];

  if (params.bookingContact?.trim()) {
    lines.push(`문의: ${params.bookingContact.trim()}`);
  }

  return lines.join("\n");
}

export function mutationDoesNotContainRestrictedReservationFields(
  payload: Record<string, unknown>
) {
  const restricted = [
    "organization_id",
    "service_id",
    "duration_min",
    "buffer_min",
    "customer_privacy_agreed_at",
    "customer_privacy_policy_version",
    "legal_terms_version",
    "privacy_policy_version",
  ];

  return restricted.every((field) => !(field in payload));
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeTime(value: string) {
  const match = TIME_RE.exec(value);
  if (!match) return "";
  return `${match[1]}:${match[2]}`;
}

function isValidDateOnly(value: string) {
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );

  return (
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() === Number(match[2]) - 1 &&
    date.getUTCDate() === Number(match[3])
  );
}
