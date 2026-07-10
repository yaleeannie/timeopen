import { NextResponse } from "next/server";
import { buildBookingConfirmationCustomerSms } from "@/features/booking/bookingNotificationSms";
import {
  formatReservationDateCompactKorean,
  formatReservationTimeDisplay,
} from "@/features/booking/reservationDisplay";
import { validateReservationCreateInput } from "@/features/reservations/createReservation";
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
  const validation = validateReservationCreateInput({
    serviceId: body?.serviceId,
    customerName: body?.customerName,
    customerPhone: body?.customerPhone,
    date: body?.date,
    startTime: body?.startTime,
    sendCustomerSms: body?.sendCustomerSms,
  });

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { data: reservationId, error: createError } = await supabase.rpc(
    "create_owner_reservation",
    {
      p_service_id: validation.value.serviceId,
      p_date: validation.value.date,
      p_start: validation.value.startTime,
      p_customer_name: validation.value.customerName,
      p_customer_phone: validation.value.customerPhone,
    }
  );

  if (createError || !reservationId) {
    console.error("[reservations/create] create failed", {
      code: createError?.code,
      message: createError?.message,
      details: createError?.details,
      hint: createError?.hint,
    });
    return NextResponse.json(
      { error: createError?.message || "예약을 추가하지 못했어요." },
      { status: 400 }
    );
  }

  if (!validation.value.sendCustomerSms) {
    return NextResponse.json({
      ok: true,
      reservationId,
      smsStatus: "skipped",
      message: "예약이 추가되었어요.",
    });
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
      customer_phone,
      public_manage_token,
      organizations (
        name,
        handle,
        location_text,
        notice_text,
        booking_contact
      )
    `
    )
    .eq("id", String(reservationId))
    .maybeSingle();

  if (fetchError || !reservation) {
    console.error("[reservations/create] created reservation lookup failed", {
      message: fetchError?.message,
    });
    return NextResponse.json({
      ok: true,
      reservationId,
      smsStatus: "skipped",
      message: "예약이 추가되었어요.",
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
      reservationId,
      smsStatus: "skipped",
      message: "예약이 추가되었어요.",
    });
  }

  try {
    await sendSms(customerPhone, smsText, { subject: shopName });
    return NextResponse.json({
      ok: true,
      reservationId,
      smsStatus: "success",
      message: "예약이 추가됐고 고객에게 안내 문자를 보냈어요.",
    });
  } catch (error) {
    console.error("[reservations/create] sms failed", error);
    return NextResponse.json({
      ok: true,
      reservationId,
      smsStatus: "failed",
      message: "예약은 추가됐지만 문자 발송에 실패했어요.",
    });
  }
}
