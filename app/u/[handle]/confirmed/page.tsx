// app/u/[handle]/confirmed/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MOCK_SERVICES } from "@/features/booking/mock";

type Props = {
  params: { handle: string };
  searchParams?: { rid?: string };
};

function pickReservationDateTime(r: any) {
  const date =
    r?.date ??
    r?.date_iso ??
    r?.reservation_date ??
    r?.p_date ??
    r?.day ??
    null;

  const start =
    r?.start ??
    r?.start_time ??
    r?.start_hhmm ??
    r?.p_start ??
    null;

  const end =
    r?.end ??
    r?.end_time ??
    r?.end_hhmm ??
    r?.p_end ??
    null;

  return {
    dateText: date ? String(date) : "-",
    timeText: start ? `${String(start)}${end ? ` ~ ${String(end)}` : ""}` : "-",
  };
}

function pickOrgFromReservation(reservation: any) {
  const org = Array.isArray(reservation?.organizations)
    ? reservation.organizations[0]
    : reservation?.organizations;

  return {
    locationText: org?.location_text ? String(org.location_text) : "",
    noticeText: org?.notice_text ? String(org.notice_text) : "",
  };
}

export default async function ConfirmedPage({ params, searchParams }: Props) {
  const handle = params.handle;
  const rid = searchParams?.rid ? String(searchParams.rid) : "";

  const supabase = await createSupabaseServerClient();

  // handle 기준 org fallback 조회
  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id, handle, location_text, notice_text")
    .eq("handle", handle)
    .maybeSingle();

  let reservation: any = null;
  let reservationErrMsg: string | null = null;

  if (!rid) {
    reservationErrMsg = "예약 ID(rid)가 없습니다.";
  } else {
    const { data: r, error: rErr } = await supabase
      .from("reservations")
      .select(
        `
        *,
        organizations (
          id,
          handle,
          location_text,
          notice_text
        )
      `
      )
      .eq("id", rid)
      .maybeSingle();

    if (rErr) {
      reservationErrMsg = rErr.message;
    } else {
      reservation = r ?? null;
    }

    const orgId = (org as any)?.id ?? null;
    const rOrgId = reservation?.organization_id ?? null;

    if (orgId && rOrgId && String(orgId) !== String(rOrgId)) {
      reservation = null;
      reservationErrMsg = "예약 정보를 찾을 수 없습니다.";
    }
  }

  const reservationOrg = reservation ? pickOrgFromReservation(reservation) : null;

  const locationText =
    reservationOrg?.locationText ||
    ((org as any)?.location_text ? String((org as any).location_text) : "");

  const noticeText =
    reservationOrg?.noticeText ||
    ((org as any)?.notice_text ? String((org as any).notice_text) : "");

  const { dateText, timeText } = reservation
    ? pickReservationDateTime(reservation)
    : { dateText: "-", timeText: "-" };

  const serviceId = reservation?.service_id ? String(reservation.service_id) : "";
  const serviceName =
    MOCK_SERVICES.find((s) => s.id === serviceId)?.name || serviceId || "-";
  const customerName =
    reservation?.customer_name ? String(reservation.customer_name) : "-";
  const customerPhone =
    reservation?.customer_phone ? String(reservation.customer_phone) : "-";

  return (
    <main style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900 }}>예약이 확정되었습니다</h1>

      <div style={{ marginTop: 16, lineHeight: 1.8 }}>
        <div>예약 날짜: {dateText}</div>
        <div>예약 시간: {timeText}</div>
       <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 800 }}>서비스</div>
        <div>{serviceName}</div>
       </div>
        <div>예약자 이름: {customerName}</div>
        <div>전화번호: {customerPhone}</div>
      </div>

      <div style={{ marginTop: 20, lineHeight: 1.8 }}>
        <div style={{ fontWeight: 800 }}>📍 위치</div>
        <div style={{ whiteSpace: "pre-wrap" }}>{locationText || "-"}</div>

        <div style={{ marginTop: 14, fontWeight: 800 }}>📢 예약 안내</div>
        <div style={{ whiteSpace: "pre-wrap" }}>{noticeText || "-"}</div>
      </div>

      {!org ? (
        <div style={{ marginTop: 16, color: "#b00020", fontWeight: 700 }}>
          organization을 찾을 수 없습니다. (handle: {handle}){" "}
          {orgErr ? ` / ${orgErr.message}` : ""}
        </div>
      ) : null}

      {!reservation ? (
        <div style={{ marginTop: 16, color: "#b00020", fontWeight: 700 }}>
          예약 정보를 불러오지 못했습니다.{" "}
          {reservationErrMsg ? `(${reservationErrMsg})` : ""}
        </div>
      ) : null}

      <div style={{ marginTop: 24 }}>
        <Link href={`/u/${handle}`} style={{ textDecoration: "underline", fontWeight: 800 }}>
          예약 페이지로 돌아가기
        </Link>
      </div>
    </main>
  );
}