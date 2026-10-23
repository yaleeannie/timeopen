import { NextResponse } from "next/server";
import { validateCustomerName } from "@/features/validation/fieldLimits";
import { buildCustomerPrivacyConsentPayload } from "@/features/legal/consent";
import {
  isDatabaseMaintenanceError,
  isMaintenanceMode,
  maintenanceApiResponse,
} from "@/lib/maintenance";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (isMaintenanceMode()) {
    return maintenanceApiResponse(
      "TimeOpen 서비스를 일시 중지 중이라 새 예약을 할 수 없습니다."
    );
  }

  const body = await request.json().catch(() => null);
  const customerName = validateCustomerName(body?.customerName);
  const privacyConsent = buildCustomerPrivacyConsentPayload({
    agreed: body?.customerPrivacyAgreed === true,
  });
  if (!customerName.ok || !privacyConsent.ok) {
    return NextResponse.json(
      { error: !customerName.ok ? customerName.error : privacyConsent.error },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_reservation_by_handle", {
    p_handle: body?.handle,
    p_service_id: body?.serviceId,
    p_date: body?.dateISO,
    p_start: body?.start,
    p_end: body?.end,
    p_duration_min: body?.durationMin,
    p_buffer_min: body?.bufferMin,
    p_customer_name: customerName.value,
    p_customer_phone: body?.customerPhone,
    p_customer_privacy_agreed: true,
    p_customer_privacy_agreed_at: privacyConsent.customer_privacy_agreed_at,
    p_customer_privacy_policy_version:
      privacyConsent.customer_privacy_policy_version,
  });

  if (error) {
    if (isDatabaseMaintenanceError(error)) {
      return maintenanceApiResponse(
        "TimeOpen 서비스를 일시 중지 중이라 새 예약을 할 수 없습니다."
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const reservationId =
    (typeof data === "string" || typeof data === "number" ? data : null) ??
    (data as any)?.id ??
    (data as any)?.reservation_id ??
    (Array.isArray(data) ? (data as any)[0]?.id ?? (data as any)[0]?.reservation_id : null);

  if (!reservationId) {
    return NextResponse.json({ error: "예약 ID를 확인할 수 없습니다." }, { status: 500 });
  }
  return NextResponse.json({ reservationId: String(reservationId) });
}
