import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  sendSms,
  SmsSendError,
  type SmsSendResult,
} from "@/lib/notify/sendSms";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

type RecipientType = "owner" | "customer";
type SmsLogStatus = "success" | "failed" | "skipped";

function getCountryCode(phone: string) {
  const supportedCodes = ["+82", "+81", "+1", "+66", "+86"];
  return supportedCodes.find((code) => phone.startsWith(code)) ?? null;
}

function getProviderMessageId(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  for (const key of ["messageId", "message_id", "groupId", "group_id"]) {
    const value = record[key];
    if (typeof value === "string" && value) return value;
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = getProviderMessageId(item);
        if (found) return found;
      }
    } else if (value && typeof value === "object") {
      const found = getProviderMessageId(value);
      if (found) return found;
    }
  }

  return null;
}

function sanitizeProviderPayload(payload: unknown): unknown {
  if (Array.isArray(payload)) {
    return payload.map(sanitizeProviderPayload);
  }

  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (
      ["text", "content", "apiKey", "apiSecret", "authorization"].includes(key)
    ) {
      continue;
    }
    result[key] = sanitizeProviderPayload(value);
  }
  return result;
}

async function saveSmsLog(params: {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  handle: string;
  reservationId: string;
  recipientType: RecipientType;
  toPhone: string;
  status: SmsLogStatus;
  messageLength: number;
  result?: SmsSendResult;
  errorMessage?: string;
}) {
  try {
    const { error } = await params.supabase.rpc("log_sms_attempt", {
      p_handle: params.handle,
      p_reservation_id: params.reservationId,
      p_recipient_type: params.recipientType,
      p_message_type: "booking_confirm",
      p_to_phone: params.toPhone || null,
      p_country_code: getCountryCode(params.toPhone),
      p_status: params.status,
      p_provider: "solapi",
      p_provider_message_id: params.result
        ? getProviderMessageId(params.result.responsePayload)
        : null,
      p_provider_status_code: params.result?.statusCode ?? null,
      p_error_message: params.errorMessage ?? null,
      p_request_payload: { message_length: params.messageLength },
      p_response_payload: params.result
        ? sanitizeProviderPayload(params.result.responsePayload)
        : null,
    });

    if (error) {
      console.error("[notify/booking] sms log save failed", {
        recipientType: params.recipientType,
        status: params.status,
        message: error.message,
      });
    }
  } catch (error) {
    console.error("[notify/booking] sms log save exception", {
      recipientType: params.recipientType,
      status: params.status,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const reservationId = body?.reservationId;
  const handle = clean(body?.handle);

  console.log("[notify/booking] request", {
    reservationId,
    handle,
    hasReservationId: Boolean(reservationId),
    hasHandle: Boolean(handle),
  });

  if (!reservationId || !handle) {
    console.error("[notify/booking] invalid request body", {
      hasReservationId: Boolean(reservationId),
      hasHandle: Boolean(handle),
    });
    return NextResponse.json(
      { error: "reservationId and handle required" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc(
    "get_public_reservation_confirmation",
    {
      p_handle: handle,
      p_reservation_id: reservationId,
    }
  );
  const rowsCount = Array.isArray(data) ? data.length : data ? 1 : 0;

  console.log("[notify/booking] confirmation rpc result", {
    rowsCount,
    dataIsNull: data == null,
    hasError: Boolean(error),
  });

  if (error) {
    console.error("[notify/booking] confirmation rpc failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      reservationId,
      handle,
    });
    return NextResponse.json(
      { error: "reservation lookup failed" },
      { status: 500 }
    );
  }

  const reservation = Array.isArray(data) ? data[0] ?? null : data;

  if (!reservation) {
    console.error("[notify/booking] confirmation not found", {
      reservationId,
      handle,
      rowsCount,
    });
    return NextResponse.json({ error: "reservation not found" }, { status: 404 });
  }

  const orgName = handle || "예약";
  const locationText = clean(reservation.location_text);
  const noticeText = clean(reservation.notice_text);
  const serviceName = clean(reservation.service_name) || "예약";
  const ownerPhone = process.env.OWNER_PHONE || "";
  const date = clean(reservation.reservation_date);
  const time = clean(reservation.start_time);
  const customerName = clean(reservation.customer_name);
  const customerPhone = clean(reservation.customer_phone);

  const ownerLines = [
    "[TimeOpen]",
    "",
    "새 예약",
    "",
    "서비스",
    serviceName,
    "",
    "일시",
    `${date} ${time}`,
    "",
    "고객",
    customerName || "-",
    customerPhone || "-",
  ];

  const guestLines = [
    "[TimeOpen]",
    "",
    `${orgName} 예약이 확정되었습니다.`,
    "",
    "서비스",
    serviceName,
    "",
    "일시",
    `${date} ${time}`,
  ];

  if (locationText) {
    guestLines.push("", "위치", locationText);
  }

  if (noticeText) {
    guestLines.push("", "안내", noticeText);
  }

  const ownerMsg = ownerLines.join("\n");
  const guestMsg = guestLines.join("\n");

  console.log("[notify/booking] ownerPhone =", ownerPhone);
  console.log("[notify/booking] customerPhone =", customerPhone);
  console.log("[notify/booking] serviceName =", serviceName);

  // ✅ 판매자 문자 따로
  if (ownerPhone) {
    try {
      console.log("[notify/booking] owner sms start");
      const result = await sendSms(ownerPhone, ownerMsg);
      console.log("[notify/booking] owner sms done");
      await saveSmsLog({
        supabase,
        handle,
        reservationId,
        recipientType: "owner",
        toPhone: ownerPhone,
        status: "success",
        messageLength: ownerMsg.length,
        result,
      });
    } catch (e) {
      console.error("[notify/booking] owner sms failed", e);
      await saveSmsLog({
        supabase,
        handle,
        reservationId,
        recipientType: "owner",
        toPhone: ownerPhone,
        status: "failed",
        messageLength: ownerMsg.length,
        result: e instanceof SmsSendError ? e.result : undefined,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    await saveSmsLog({
      supabase,
      handle,
      reservationId,
      recipientType: "owner",
      toPhone: "",
      status: "skipped",
      messageLength: ownerMsg.length,
      errorMessage: "OWNER_PHONE is empty",
    });
  }

  // ✅ 고객 문자 따로
  if (customerPhone) {
    try {
      console.log("[notify/booking] guest sms start");
      const result = await sendSms(customerPhone, guestMsg);
      console.log("[notify/booking] guest sms done");
      await saveSmsLog({
        supabase,
        handle,
        reservationId,
        recipientType: "customer",
        toPhone: customerPhone,
        status: "success",
        messageLength: guestMsg.length,
        result,
      });
    } catch (e) {
      console.error("[notify/booking] guest sms failed", e);
      await saveSmsLog({
        supabase,
        handle,
        reservationId,
        recipientType: "customer",
        toPhone: customerPhone,
        status: "failed",
        messageLength: guestMsg.length,
        result: e instanceof SmsSendError ? e.result : undefined,
        errorMessage: e instanceof Error ? e.message : String(e),
      });
    }
  } else {
    await saveSmsLog({
      supabase,
      handle,
      reservationId,
      recipientType: "customer",
      toPhone: "",
      status: "skipped",
      messageLength: guestMsg.length,
      errorMessage: "customer phone is empty",
    });
  }

  return NextResponse.json({ ok: true });
}
