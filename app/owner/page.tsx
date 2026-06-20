export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { getSiteUrl } from "@/lib/siteUrl";
import LogoutButton from "./LogoutButton";
import SummaryPanel from "./SummaryPanel";

const SITE_URL = getSiteUrl();

type SmsLogRow = {
  reservation_id: string | null;
  recipient_type: "owner" | "customer";
  status: "success" | "failed" | "skipped";
  created_at: string;
};

type SmsDisplayStatus = "success" | "partial" | "failed" | "none";

function getTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentTimeText() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function smsStatusLabel(status: SmsDisplayStatus) {
  switch (status) {
    case "success":
      return "문자 완료";
    case "partial":
      return "문자 일부 완료";
    case "failed":
      return "문자 실패";
    default:
      return "문자 없음";
  }
}

function smsStatusStyle(status: SmsDisplayStatus) {
  switch (status) {
    case "success":
      return "border-[#99f6e4] bg-[#ccfbf1] text-[#0f766e]";
    case "partial":
      return "border-[#fde68a] bg-[#fef3c7] text-[#92400e]";
    case "failed":
      return "border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]";
    default:
      return "border-gray-200 bg-gray-100 text-gray-500";
  }
}

function getSmsDisplayStatus(logs: SmsLogRow[]): SmsDisplayStatus {
  const latestByRecipient = new Map<SmsLogRow["recipient_type"], SmsLogRow>();

  for (const log of logs) {
    if (!latestByRecipient.has(log.recipient_type)) {
      latestByRecipient.set(log.recipient_type, log);
    }
  }

  const ownerStatus = latestByRecipient.get("owner")?.status;
  const customerStatus = latestByRecipient.get("customer")?.status;
  const statuses = [ownerStatus, customerStatus].filter(Boolean);

  if (statuses.includes("failed")) return "failed";
  if (ownerStatus === "success" && customerStatus === "success") return "success";
  if (statuses.includes("success")) return "partial";
  return "none";
}

function formatReservationTime(value: unknown, fallback: unknown) {
  if (value) return String(value).slice(0, 5);
  if (!fallback) return "";

  const date = new Date(String(fallback));
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function MenuCard({
  href,
  title,
  description,
  symbol,
  colorClass,
}: {
  href: string;
  title: string;
  description: string;
  symbol: string;
  colorClass: string;
}) {
  return (
    <a
      href={href}
      className={`flex min-h-32 min-w-0 flex-col justify-between rounded-2xl p-4 text-white shadow-sm transition hover:brightness-95 ${colorClass}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-black">
        {symbol}
      </span>
      <div>
        <div className="text-base font-black tracking-tight">{title}</div>
        <div className="mt-1 text-sm leading-5 text-white/80">{description}</div>
      </div>
    </a>
  );
}

export default async function OwnerPage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-3 text-3xl font-black tracking-tight">TimeOpen 관리자</h1>
          <div className="font-extrabold text-red-700">
            owner 정보를 불러오지 못했습니다: {error}
          </div>
        </div>
      </main>
    );
  }

  if (!organizationId) {
    return (
      <main className="min-h-screen bg-gray-100 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-3 text-3xl font-black tracking-tight">TimeOpen 관리자</h1>
          <div className="font-extrabold text-red-700">organizationId를 찾을 수 없습니다.</div>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("name, handle, location_text, notice_text")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgErr) {
    return (
      <main className="min-h-screen bg-gray-100 px-5 py-10 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-3 text-3xl font-black tracking-tight">TimeOpen 관리자</h1>
          <div className="font-extrabold text-red-700">
            organizations 조회 오류: {orgErr.message}
          </div>
        </div>
      </main>
    );
  }

  const nameText = (orgRow?.name as string | null) ?? "";
  const finalHandle = (orgRow?.handle as string | null) ?? handle;
  const previewPath = finalHandle ? `/u/${finalHandle}` : "-";
  const previewFullLink = finalHandle ? `${SITE_URL}/u/${finalHandle}` : "";
  const canLink = !!finalHandle && finalHandle !== "null";

  const todayISO = getTodayISO();

  const { count: todayReservationCount } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("date", todayISO)
    .eq("status", "confirmed");

  const { data: todayReservationRows } = await supabase
    .from("reservations")
    .select("id, start_time, end_time, start_at, end_at, customer_name")
    .eq("organization_id", organizationId)
    .eq("date", todayISO)
    .eq("status", "confirmed")
    .order("start_time", { ascending: true });

  const todayReservationIds = (todayReservationRows ?? []).map((reservation) =>
    String(reservation.id)
  );
  let smsLogs: SmsLogRow[] = [];

  if (todayReservationIds.length > 0) {
    const { data: smsLogRows, error: smsLogErr } = await supabase
      .from("sms_logs")
      .select("reservation_id, recipient_type, status, created_at")
      .eq("organization_id", organizationId)
      .eq("message_type", "booking_confirm")
      .in("reservation_id", todayReservationIds)
      .order("created_at", { ascending: false });

    if (smsLogErr) {
      console.error("[owner] sms_logs 조회 실패", smsLogErr.message);
    } else {
      smsLogs = (smsLogRows ?? []) as SmsLogRow[];
    }
  }

  const smsLogsByReservation = smsLogs.reduce((map, log) => {
    if (!log.reservation_id) return map;
    const logs = map.get(log.reservation_id) ?? [];
    logs.push(log);
    map.set(log.reservation_id, logs);
    return map;
  }, new Map<string, SmsLogRow[]>());

  const currentTimeText = getCurrentTimeText();
  const todayScheduleReservations = (todayReservationRows ?? []).map((reservation) => {
    const id = String(reservation.id);
    const start = formatReservationTime(reservation.start_time, reservation.start_at);
    const end = formatReservationTime(reservation.end_time, reservation.end_at);

    return {
      id,
      time: start || "시간 미정",
      customer: reservation.customer_name
        ? String(reservation.customer_name)
        : "고객명 미입력",
      isPast: Boolean(end && end < currentTimeText),
      smsStatus: getSmsDisplayStatus(smsLogsByReservation.get(id) ?? []),
    };
  });

  const nextReservation =
    todayScheduleReservations.find(
      (reservation) =>
        reservation.time !== "시간 미정" && reservation.time >= currentTimeText
    ) ?? null;
  const nextReservationTime = nextReservation?.time ?? "";
  const nextReservationCustomer = nextReservation?.customer ?? "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f8] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] bg-[#fbfdfe] shadow-[0_20px_60px_rgba(80,145,164,0.14)] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
          <header className="mb-6 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-[#28b9dc]">
                {nameText || "TimeOpen"}
              </div>
              <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-gray-950">
                대시보드
              </h1>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                {todayISO} 오늘 예약 현황
              </p>
            </div>

            <div className="shrink-0">
              <LogoutButton />
            </div>
          </header>

          <section className="mb-7" aria-label="오늘 요약">
            <SummaryPanel
              todayReservationCount={todayReservationCount ?? 0}
              nextReservationTime={nextReservationTime}
              nextReservationCustomer={nextReservationCustomer}
              previewPath={previewPath}
              previewFullLink={previewFullLink}
              canLink={canLink}
              todayISO={todayISO}
            />
          </section>

          <section className="mb-7" aria-labelledby="today-schedule">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 id="today-schedule" className="text-base font-black tracking-tight">
                오늘 일정
              </h2>
              <a href="/reservations" className="text-sm font-bold text-[#28b9dc]">
                전체 보기
              </a>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
              {todayScheduleReservations.length > 0 ? (
                todayScheduleReservations.map((reservation) => (
                  <a
                    key={reservation.id}
                    href={`/reservations?date=${todayISO}`}
                    className={`flex min-w-0 items-center gap-3 border-b border-gray-100 px-4 py-3.5 transition last:border-b-0 hover:bg-gray-50 ${
                      reservation.isPast ? "bg-gray-50/70 opacity-60" : ""
                    }`}
                  >
                    <div
                      className={`flex h-14 w-[68px] shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                        reservation.isPast
                          ? "bg-gray-200 text-gray-500"
                          : "bg-[#e8f9fd] text-[#20afd2]"
                      }`}
                    >
                      {reservation.time}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-gray-900">
                        {reservation.customer}
                      </div>
                      <div className="mt-0.5 text-sm text-gray-400">확정 예약</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${smsStatusStyle(
                        reservation.smsStatus
                      )}`}
                    >
                      {smsStatusLabel(reservation.smsStatus)}
                    </span>
                    <span className="shrink-0 text-gray-300">›</span>
                  </a>
                ))
              ) : (
                <div className="px-5 py-8 text-center">
                  <div className="text-sm font-extrabold text-gray-700">남은 일정이 없습니다</div>
                  <div className="mt-1 text-sm text-gray-400">오늘 예약을 모두 확인했습니다.</div>
                </div>
              )}
            </div>
          </section>

          <section aria-labelledby="quick-menu">
            <div className="mb-3 px-1">
              <h2 id="quick-menu" className="text-base font-black tracking-tight">
                빠른 메뉴
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MenuCard
                href="/reservations"
                symbol="✓"
                colorClass="bg-gradient-to-br from-[#55d4f0] to-[#28b9e3]"
                title="예약"
                description="전체 일정 확인"
              />

              <MenuCard
                href="/settings/services"
                symbol="+"
                colorClass="bg-gradient-to-br from-[#58dfbe] to-[#2fc9a5]"
                title="서비스"
                description="메뉴와 가격 관리"
              />

              <MenuCard
                href="/settings/availability"
                symbol="◷"
                colorClass="bg-gradient-to-br from-[#8a63f4] to-[#653de0]"
                title="영업시간"
                description="운영 시간 설정"
              />

              <MenuCard
                href="/settings/profile"
                symbol="···"
                colorClass="bg-gradient-to-br from-[#61a8fa] to-[#477eea]"
                title="설정"
                description="매장 정보 관리"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
