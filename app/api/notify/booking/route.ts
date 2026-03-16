import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/notify/sendSms";
import { MOCK_SERVICES } from "@/features/booking/mock";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const reservationId = body?.reservationId;

  console.log("[notify/booking] start", { reservationId });

  if (!reservationId) {
    console.log("[notify/booking] reservationId missing");
    return NextResponse.json({ error: "reservationId required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data: r, error } = await supabase
    .from("reservations")
    .select(
      `
      id,
      date,
      start_time,
      service_id,
      customer_name,
      customer_phone,
      organizations (
        handle,
        location_text,
        notice_text
      )
    `
    )
    .eq("id", reservationId)
    .single();

  console.log("[notify/booking] reservation query", { error, r });

  if (error || !r) {
    return NextResponse.json({ error: "reservation not found" }, { status: 404 });
  }

  const org = Array.isArray((r as any).organizations)
    ? (r as any).organizations[0]
    : (r as any).organizations;

  const orgName = clean(org?.handle) || "예약";
  const locationText = clean(org?.location_text);
  const noticeText = clean(org?.notice_text);
  const serviceId = clean((r as any).service_id);
  const serviceName =
    MOCK_SERVICES.find((s) => s.id === serviceId)?.name || serviceId || "예약";

  const ownerPhone = process.env.OWNER_PHONE!;
  const date = clean(r.date);
  const time = clean(r.start_time);
  const customerName = clean(r.customer_name);
  const customerPhone = clean(r.customer_phone);

  console.log("[notify/booking] phones", {
    ownerPhone,
    customerPhone,
    sender: process.env.SOLAPI_SENDER,
  });

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

  if (locationText) guestLines.push("", "위치", locationText);
  if (noticeText) guestLines.push("", "안내", noticeText);

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
    customerName,
    customerPhone,
  ];

  try {
    console.log("[notify/booking] owner sms start");
    await sendSms(ownerPhone, ownerLines.join("\n"));

    console.log("[notify/booking] guest sms start");
    await sendSms(customerPhone, guestLines.join("\n"));

    console.log("[notify/booking] sms done");
  } catch (e) {
    console.error("[notify/booking] sms failed", e);
  }

  return NextResponse.json({ ok: true });
}