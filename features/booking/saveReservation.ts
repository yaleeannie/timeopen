import { validateCustomerName } from "@/features/validation/fieldLimits";

export type Params = {
  handle: string;
  serviceId: string;
  dateISO: string;
  start: string;
  end: string;
  durationMin: number;
  bufferMin: number;
  customerName: string;
  customerPhone: string;
  customerPrivacyAgreed: boolean;
};

export async function saveReservation(params: Params): Promise<string> {
  const customerName = validateCustomerName(params.customerName);
  if (!customerName.ok) {
    throw new Error(customerName.error);
  }

  const response = await fetch("/api/reservations/public-create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...params, customerName: customerName.value }),
  });
  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const error = result?.error || "예약을 저장하지 못했습니다.";
    if (/selected time is blocked/i.test(error)) {
      throw new Error("선택한 시간은 예약이 막혀 있어요. 다른 시간을 선택해주세요.");
    }
    if (/selected time is no longer available/i.test(error)) {
      throw new Error("이미 예약된 시간이에요. 다른 시간을 선택해주세요.");
    }
    throw new Error(error);
  }

  const rid = result?.reservationId;

  if (!rid) {
    throw new Error("예약은 저장됐지만 reservation id를 찾을 수 없습니다.");
  }

  return String(rid);
}
