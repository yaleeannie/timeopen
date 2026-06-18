export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export default async function ConfirmedPage({ params, searchParams }: Props) {
  const handle = params.handle;
  const rid = searchParams?.rid ? String(searchParams.rid) : "";

  const supabase = await createSupabaseServerClient();

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id, handle, location_text, notice_text")
    .eq("handle", handle)
    .maybeSingle();

  let reservation: any = null;
  let reservationErrMsg: string | null = null;
  let serviceName = "-";

  if (!rid) {
    reservationErrMsg = "예약 ID(rid)가 없습니다.";
  } else {
    const { data: r, error: rErr } = await supabase
      .from("reservations")
      .select(
        `
        id,
        organization_id,
        date,
        start_time,
        end_time,
        start_at,
        end_at,
        service_id,
        customer_name,
        customer_phone
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

    if (reservation?.service_id) {
      const { data: serviceRow } = await supabase
        .from("services")
        .select("name")
        .eq("id", reservation.service_id)
        .maybeSingle();

      if (serviceRow?.name) {
        serviceName = String(serviceRow.name);
      } else {
        serviceName = String(reservation.service_id);
      }
    }
  }

  const locationText = (org as any)?.location_text
    ? String((org as any).location_text)
    : "";
  const noticeText = (org as any)?.notice_text
    ? String((org as any).notice_text)
    : "";

  const { dateText, timeText } = reservation
    ? pickReservationDateTime(reservation)
    : { dateText: "-", timeText: "-" };

  const customerName = reservation?.customer_name
    ? String(reservation.customer_name)
    : "-";

  const customerPhone = reservation?.customer_phone
    ? String(reservation.customer_phone)
    : "-";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f8] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] bg-[#fbfdfe] shadow-[0_20px_60px_rgba(80,145,164,0.14)] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8">
          <header className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#58dfbe] to-[#2fc9a5] text-3xl font-black text-white shadow-[0_12px_26px_rgba(47,201,165,0.24)]">
              ✓
            </div>
            <div className="mt-4 text-sm font-bold text-[#22a988]">예약 완료</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">예약이 확정되었습니다</h1>
            <p className="mt-2 text-sm leading-5 text-gray-500">
              예약 정보를 확인해주세요.
            </p>
          </header>

          <section className="rounded-[24px] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] p-5 text-white shadow-[0_14px_30px_rgba(40,185,220,0.22)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <div className="text-sm font-bold text-cyan-50">예약 날짜</div>
                <div className="mt-1 break-words text-lg font-black [overflow-wrap:anywhere]">
                  {dateText}
                </div>
              </div>
              <div className="min-w-0 text-right">
                <div className="text-sm font-bold text-cyan-50">예약 시간</div>
                <div className="mt-1 break-words text-lg font-black [overflow-wrap:anywhere]">
                  {timeText}
                </div>
              </div>
            </div>
            <div className="my-4 h-px bg-white/20" />
            <div>
              <div className="text-sm font-bold text-cyan-50">서비스</div>
              <div className="mt-1 break-words text-xl font-black [overflow-wrap:anywhere]">
                {serviceName}
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
            <div className="mb-3 text-base font-black">예약자 정보</div>
            <div className="grid gap-3">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-400">이름</span>
                <span className="min-w-0 break-words text-right text-sm font-bold [overflow-wrap:anywhere]">
                  {customerName}
                </span>
              </div>
              <div className="flex min-w-0 items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-400">전화번호</span>
                <span className="min-w-0 break-words text-right text-sm font-bold [overflow-wrap:anywhere]">
                  {customerPhone}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
            <div className="mb-4 text-base font-black">방문 안내</div>
            <div className="mb-4">
              <div className="text-sm font-bold text-[#28b9dc]">위치</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">
                {locationText || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-[#28b9dc]">예약 안내</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">
                {noticeText || "-"}
              </div>
            </div>
          </section>

          {!org ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 [overflow-wrap:anywhere]">
              organization을 찾을 수 없습니다. (handle: {handle}){" "}
              {orgErr ? ` / ${orgErr.message}` : ""}
            </div>
          ) : null}

          {!reservation ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 [overflow-wrap:anywhere]">
              예약 정보를 불러오지 못했습니다.{" "}
              {reservationErrMsg ? `(${reservationErrMsg})` : ""}
            </div>
          ) : null}

          <Link
            href={`/u/${handle}`}
            className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#28b9dc] px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-[#20afd2]"
          >
            예약 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
