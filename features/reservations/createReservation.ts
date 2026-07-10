import { validateCustomerName } from "@/features/validation/fieldLimits";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type ReservationCreateInput = {
  serviceId: unknown;
  customerName: unknown;
  customerPhone: unknown;
  date: unknown;
  startTime: unknown;
  sendCustomerSms: unknown;
};

export type ReservationCreateValue = {
  serviceId: string;
  customerName: string;
  customerPhone: string;
  date: string;
  startTime: string;
  sendCustomerSms: boolean;
};

export function validateReservationCreateInput(input: ReservationCreateInput) {
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
    return { ok: false as const, error: "예약 시간을 선택해주세요." };
  }

  return {
    ok: true as const,
    value: {
      serviceId,
      customerName: customerName.value,
      customerPhone,
      date,
      startTime,
      sendCustomerSms: input.sendCustomerSms === true,
    } satisfies ReservationCreateValue,
  };
}

export function manualReservationCreateDoesNotNotifyOwner(source: string) {
  return !/buildOwner(NewReservation|ReservationRequest|Cancellation)Sms|owner_notification_phone/.test(
    source
  );
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
