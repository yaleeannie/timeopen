import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { sendSms } from "@/lib/notify/sendSms";
import { buildBookingCancelledCustomerSms } from "@/features/booking/bookingNotificationSms";
import {
  formatReservationDateCompactKorean,
  formatReservationTimeDisplay,
} from "@/features/booking/reservationDisplay";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  let reservationId: string | null = null;

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    reservationId = body?.reservationId ?? null;
  } else {
    const formData = await req.formData().catch(() => null);
    reservationId = (formData?.get("reservationId") as string | null) ?? null;
  }

  if (!reservationId) {
    return NextResponse.json({ error: "reservationId required" }, { status: 400 });
  }

  const { data: reservation, error: rErr } = await supabase
    .from("reservations")
    .select(
      `
      id,
      organization_id,
      service_id,
      date,
      start_time,
      status,
      customer_phone,
      organizations (
        name,
        booking_contact,
        handle
      )
    `
    )
    .eq("id", reservationId)
    .maybeSingle();

  if (rErr || !reservation) {
    return NextResponse.json({ error: "reservation not found" }, { status: 404 });
  }

  const { data: member } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", reservation.organization_id)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (!member) {
    return NextResponse.json({ error: "owner only" }, { status: 403 });
  }

  if (reservation.status === "cancelled") {
    return NextResponse.redirect(new URL("/reservations", req.url));
  }

  const { error: updateErr } = await supabase
    .from("reservations")
    .update({
      status: "cancelled",
      canceled_at: new Date().toISOString(),
    })
    .eq("id", reservationId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const org = Array.isArray((reservation as any).organizations)
    ? (reservation as any).organizations[0]
    : (reservation as any).organizations;

  const orgName = clean(org?.name) || clean(org?.handle);
  const bookingContact = clean(org?.booking_contact);
  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("organization_id", (reservation as any).organization_id)
    .eq("id", String((reservation as any).service_id))
    .maybeSingle();
  const serviceName = clean((service as any)?.name) || "예약";
  const date =
    formatReservationDateCompactKorean((reservation as any).date) ||
    clean((reservation as any).date);
  const time =
    formatReservationTimeDisplay((reservation as any).start_time) ||
    clean((reservation as any).start_time);
  const customerPhone = clean((reservation as any).customer_phone);

  const cancelMsg = buildBookingCancelledCustomerSms({
    shopName: orgName,
    serviceName,
    dateTime: `${date} ${time}`,
    bookingContact,
  });

  try {
    if (customerPhone) {
      await sendSms(customerPhone, cancelMsg, { subject: orgName });
    }
  } catch (e) {
    console.error("[cancel] sms failed", e);
  }

  return NextResponse.redirect(new URL("/reservations", req.url));
}
