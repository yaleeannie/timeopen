import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/notify/sendSms";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
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
