export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { getSiteUrl } from "@/lib/siteUrl";
import LogoutButton from "./LogoutButton";
import SummaryPanel from "./SummaryPanel";

const SITE_URL = getSiteUrl();

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

  const { data: nextReservationRows } = await supabase
    .from("reservations")
    .select("start_time, customer_name")
    .eq("organization_id", organizationId)
    .eq("date", todayISO)
    .eq("status", "confirmed")
    .gte("start_time", getCurrentTimeText())
    .order("start_time", { ascending: true })
    .limit(3);

  const nextReservation = nextReservationRows?.[0] ?? null;
  const nextReservationTime = nextReservation?.start_time
    ? String(nextReservation.start_time).slice(0, 5)
    : "";
  const nextReservationCustomer = nextReservation?.customer_name
    ? String(nextReservation.customer_name)
    : "";
  const upcomingReservations = (nextReservationRows ?? []).map((reservation) => ({
    time: reservation.start_time ? String(reservation.start_time).slice(0, 5) : "시간 미정",
    customer: reservation.customer_name ? String(reservation.customer_name) : "고객명 미입력",
  }));

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
                오늘
              </h1>
              <p className="mt-1 text-sm leading-5 text-gray-500">
                {todayISO} 예약 현황
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
              {upcomingReservations.length > 0 ? (
                upcomingReservations.map((reservation, index) => (
                  <div
                    key={`${reservation.time}-${index}`}
                    className="flex min-w-0 items-center gap-3 border-b border-gray-100 px-4 py-3.5 last:border-b-0"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f9fd] text-sm font-black text-[#20afd2]">
                      {reservation.time}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-extrabold text-gray-900">
                        {reservation.customer}
                      </div>
                      <div className="mt-0.5 text-sm text-gray-400">확정 예약</div>
                    </div>
                    <span className="shrink-0 text-gray-300">›</span>
                  </div>
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
