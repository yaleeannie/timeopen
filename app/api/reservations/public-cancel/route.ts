import { NextResponse } from "next/server";
import { buildBookingCancelledCustomerSms } from "@/features/booking/bookingNotificationSms";
import {
  formatReservationDateCompactKorean,
  formatReservationTimeDisplay,
} from "@/features/booking/reservationDisplay";
import { sendSms } from "@/lib/notify/sendSms";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapCancelError(message: string) {
  if (/window|3 days|가까/.test(message)) {
    return "예약 시간이 가까워 직접 취소가 어려워요. 취소가 필요하면 샵에 문의해주세요.";
  }
  if (/already/.test(message)) {
    return "이미 취소된 예약이에요.";
  }
  return "예약 정보를 찾을 수 없어요.";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = clean(body?.token);

  if (!token) {
    return NextResponse.json(
      { ok: false, error: "예약 정보를 찾을 수 없어요." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "cancel_public_reservation_by_manage_token",
    { p_token: token }
  );

  if (error) {
    console.error("[public-cancel] cancel failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    return NextResponse.json(
      { ok: false, error: mapCancelError(error.message) },
      { status: 400 }
    );
  }

  const reservation = Array.isArray(data) ? data[0] ?? null : data;

  if (!reservation) {
    return NextResponse.json(
      { ok: false, error: "예약 정보를 찾을 수 없어요." },
      { status: 404 }
    );
  }

  const shopName = clean(reservation.organization_name);
  const serviceName = clean(reservation.service_name) || "예약";
  const bookingContact = clean(reservation.booking_contact);
  const customerPhone = clean(reservation.customer_phone);
  const date =
    formatReservationDateCompactKorean(reservation.reservation_date) ||
    clean(reservation.reservation_date);
  const time =
    formatReservationTimeDisplay(reservation.start_time) ||
    clean(reservation.start_time);

  if (!customerPhone) {
    return NextResponse.json({
      ok: true,
      smsStatus: "skipped",
      message: "예약이 취소되었어요.",
    });
  }

  const smsText = buildBookingCancelledCustomerSms({
    shopName,
    serviceName,
    dateTime: `${date} ${time}`.trim(),
    bookingContact,
  });

  try {
    await sendSms(customerPhone, smsText, { subject: shopName });
    return NextResponse.json({
      ok: true,
      smsStatus: "success",
      message: "예약이 취소되었어요.",
    });
  } catch (smsError) {
    console.error("[public-cancel] sms failed", smsError);
    return NextResponse.json({
      ok: true,
      smsStatus: "failed",
      message: "예약은 취소됐지만 문자 발송에 실패했어요.",
    });
  }
}
