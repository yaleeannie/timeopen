import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { validateCustomerName } from "@/features/validation/fieldLimits";
import { buildCustomerPrivacyConsentPayload } from "@/features/legal/consent";

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

  const customerPrivacyConsent = buildCustomerPrivacyConsentPayload({
    agreed: params.customerPrivacyAgreed,
  });
  if (!customerPrivacyConsent.ok) {
    throw new Error(customerPrivacyConsent.error);
  }

  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("create_reservation_by_handle", {
    p_handle: params.handle,
    p_service_id: params.serviceId,
    p_date: params.dateISO,
    p_start: params.start,
    p_end: params.end,
    p_duration_min: params.durationMin,
    p_buffer_min: params.bufferMin,
    p_customer_name: customerName.value,
    p_customer_phone: params.customerPhone,
    p_customer_privacy_agreed: true,
    p_customer_privacy_agreed_at:
      customerPrivacyConsent.customer_privacy_agreed_at,
    p_customer_privacy_policy_version:
      customerPrivacyConsent.customer_privacy_policy_version,
  });

  if (error) {
    if (/selected time is blocked/i.test(error.message)) {
      throw new Error("선택한 시간은 예약이 막혀 있어요. 다른 시간을 선택해주세요.");
    }
    if (/selected time is no longer available/i.test(error.message)) {
      throw new Error("이미 예약된 시간이에요. 다른 시간을 선택해주세요.");
    }
    throw new Error(error.message);
  }

  const rid =
  (typeof data === "string" || typeof data === "number" ? data : null) ??
  (data as any)?.id ??
  (data as any)?.reservation_id ??
  (Array.isArray(data) ? (data as any)[0]?.id ?? (data as any)[0]?.reservation_id : null);

  if (!rid) {
    throw new Error("예약은 저장됐지만 reservation id를 찾을 수 없습니다.");
  }

  return String(rid);
}
