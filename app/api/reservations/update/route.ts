import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/notify/sendSms";
import {
  buildReservationEditRpcPayload,
  buildReservationUpdatedSms,
  validateReservationEditInput,
} from "@/features/reservations/editReservation";
import {
  formatReservationDateCompactKorean,
  formatReservationTimeDisplay,
} from "@/features/booking/reservationDisplay";

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
  const validation = validateReservationEditInput({
    reservationId: body?.reservationId,
    serviceId: body?.serviceId,
    customerName: body?.customerName,
    customerPhone: body?.customerPhone,
    date: body?.date,
    startTime: body?.startTime,
  });

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const payload = buildReservationEditRpcPayload(validation.value);
  const { error: updateError } = await supabase.rpc(
    "update_owner_reservation",
    payload
  );

  if (updateError) {
    console.error("[reservations/update] update failed", {
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });
    return NextResponse.json(
      { error: "예약을 수정하지 못했어요." },
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
      customer_phone,
      organizations (
        name,
        handle
      )
    `
    )
    .eq("id", validation.value.reservationId)
    .maybeSingle();

  if (fetchError || !reservation) {
    console.error("[reservations/update] updated reservation lookup failed", {
      message: fetchError?.message,
    });
    return NextResponse.json({
      ok: true,
      smsStatus: "skipped",
      message: "예약이 수정됐어요.",
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
  const smsText = buildReservationUpdatedSms({
    shopName,
    serviceName,
    dateTime: `${date} ${time}`.trim(),
  });

  if (!customerPhone) {
    return NextResponse.json({
      ok: true,
      smsStatus: "skipped",
      message: "예약이 수정됐어요.",
    });
  }

  try {
    await sendSms(customerPhone, smsText);
    return NextResponse.json({
      ok: true,
      smsStatus: "success",
      message: "예약이 수정됐고 고객에게 안내 문자를 보냈어요.",
    });
  } catch (error) {
    console.error("[reservations/update] sms failed", error);
    return NextResponse.json({
      ok: true,
      smsStatus: "failed",
      message: "예약은 수정됐지만 문자 발송에 실패했어요.",
    });
  }
}
