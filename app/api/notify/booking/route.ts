import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/notify/sendSms";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const reservationId = body?.reservationId;

  if (!reservationId) {
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

  if (error || !r) {
    return NextResponse.json({ error: "reservation not found" }, { status: 404 });
  }

  const org = Array.isArray((r as any).organizations)
    ? (r as any).organizations[0]
    : (r as any).organizations;

  const orgName = clean(org?.handle) || "예약";
  const locationText = clean(org?.location_text);
  const noticeText = clean(org?.notice_text);

  // ✅ service_id(UUID) -> services.name 조회
  let serviceName = "예약";
  if ((r as any).service_id) {
    const { data: serviceRow } = await supabase
      .from("services")
      .select("name")
      .eq("id", (r as any).service_id)
      .maybeSingle();

    if (serviceRow?.name) {
      serviceName = clean(serviceRow.name) || "예약";
    }
  }

  const ownerPhone = process.env.OWNER_PHONE || "";
  const date = clean(r.date);
  const time = clean(r.start_time);
  const customerName = clean(r.customer_name);
  const customerPhone = clean(r.customer_phone);

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
  try {
    if (ownerPhone) {
      console.log("[notify/booking] owner sms start");
      await sendSms(ownerPhone, ownerMsg);
      console.log("[notify/booking] owner sms done");
    }
  } catch (e) {
    console.error("[notify/booking] owner sms failed", e);
  }

  // ✅ 고객 문자 따로
  try {
    if (customerPhone) {
      console.log("[notify/booking] guest sms start");
      await sendSms(customerPhone, guestMsg);
      console.log("[notify/booking] guest sms done");
    }
  } catch (e) {
    console.error("[notify/booking] guest sms failed", e);
  }

  return NextResponse.json({ ok: true });
}