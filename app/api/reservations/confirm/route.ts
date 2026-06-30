import { NextResponse } from "next/server";
import { buildBookingConfirmationCustomerSms } from "@/features/booking/bookingNotificationSms";
import {
  formatReservationDateCompactKorean,
  formatReservationTimeDisplay,
} from "@/features/booking/reservationDisplay";
import { sendSms } from "@/lib/notify/sendSms";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/siteUrl";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const reservationId =
    typeof body?.reservationId === "string" ? body.reservationId.trim() : "";

  if (!reservationId) {
    return NextResponse.json({ error: "예약 ID가 필요합니다." }, { status: 400 });
  }

  const { error: confirmError } = await supabase.rpc(
    "confirm_owner_reservation",
    { p_reservation_id: reservationId }
  );

  if (confirmError) {
    console.error("[reservations/confirm] confirm failed", {
      code: confirmError.code,
      message: confirmError.message,
      details: confirmError.details,
      hint: confirmError.hint,
    });
    return NextResponse.json(
      { error: confirmError.message || "예약을 확정하지 못했어요." },
      { status: 400 }
    );
  }

  const { data: reservation, error: fetchError } = await supabase
    .from("reservations")
    .select(
      `
      id,
      organization_id,
      service_id,
      date,
      start_time,
      public_manage_token,
      customer_phone,
      organizations (
        name,
        handle,
        location_text,
        notice_text,
        booking_contact
      )
    `
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (fetchError || !reservation) {
    console.error("[reservations/confirm] reservation lookup failed", {
      message: fetchError?.message,
    });
    return NextResponse.json({
      ok: true,
      smsStatus: "skipped",
      message: "예약이 확정됐어요.",
    });
  }

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("organization_id", (reservation as any).organization_id)
    .eq("id", String((reservation as any).service_id))
    .maybeSingle();

  const org = Array.isArray((reservation as any).organizations)
    ? (reservation as any).organizations[0]
    : (reservation as any).organizations;
  const shopName = clean(org?.name) || clean(org?.handle) || "예약";
  const serviceName = clean((service as any)?.name) || "예약";
  const date =
    formatReservationDateCompactKorean((reservation as any).date) ||
    clean((reservation as any).date);
  const time =
    formatReservationTimeDisplay((reservation as any).start_time) ||
    clean((reservation as any).start_time);
  const customerPhone = clean((reservation as any).customer_phone);
  const manageToken = clean((reservation as any).public_manage_token);
  const manageUrl = manageToken ? `${getSiteUrl()}/r/${manageToken}` : "";
  const smsText = buildBookingConfirmationCustomerSms({
    shopName,
    serviceName,
    dateTime: `${date} ${time}`.trim(),
    locationText: clean(org?.location_text),
    noticeText: clean(org?.notice_text),
    bookingContact: clean(org?.booking_contact),
    manageUrl,
  });

  if (!customerPhone) {
    return NextResponse.json({
      ok: true,
      smsStatus: "skipped",
      message: "예약이 확정됐어요.",
    });
  }

  try {
    await sendSms(customerPhone, smsText, { subject: shopName });
    return NextResponse.json({
      ok: true,
      smsStatus: "success",
      message: "예약이 확정됐고 고객에게 안내 문자를 보냈어요.",
    });
  } catch (error) {
    console.error("[reservations/confirm] sms failed", error);
    return NextResponse.json({
      ok: true,
      smsStatus: "failed",
      message: "예약은 확정됐지만 문자 발송에 실패했어요.",
    });
  }
}
