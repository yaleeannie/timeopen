export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import LogoutButton from "./LogoutButton";
import SummaryPanel from "./SummaryPanel";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://timeopen.app").replace(/\/+$/, "");

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
  number,
}: {
  href: string;
  title: string;
  description: string;
  number: string;
}) {
  return (
    <a
      href={href}
      className="group flex min-h-40 min-w-0 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 text-gray-900 shadow-sm transition hover:border-gray-300 hover:shadow-md md:p-6 md:hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs font-bold tracking-[0.12em] text-gray-400">{number}</span>
        <span className="text-lg font-semibold text-gray-400 transition group-hover:translate-x-1 group-hover:text-gray-700">
          →
        </span>
      </div>
      <div>
        <div className="text-lg font-extrabold tracking-tight">{title}</div>
        <div className="mt-2 text-sm leading-6 text-gray-500">{description}</div>
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
    .limit(1);

  const nextReservation = nextReservationRows?.[0] ?? null;
  const nextReservationTime = nextReservation?.start_time
    ? String(nextReservation.start_time).slice(0, 5)
    : "";
  const nextReservationCustomer = nextReservation?.customer_name
    ? String(nextReservation.customer_name)
    : "";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4f6f8] px-4 py-6 text-gray-900 sm:px-6 md:px-8 md:py-10">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        <header className="mb-9 flex flex-col items-start gap-5 md:mb-12 md:flex-row md:justify-between">
          <div className="min-w-0">
            <div className="mb-4 inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-500 shadow-sm">
              {nameText || "TimeOpen"}
            </div>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-gray-950 md:text-5xl">
              오늘
            </h1>
            <p className="mt-3 text-base leading-6 text-gray-500">
              {todayISO} 예약 현황과 운영 메뉴를 확인하세요.
            </p>
          </div>

          <div className="shrink-0">
            <LogoutButton />
          </div>
        </header>

        <section className="mb-10 md:mb-12" aria-labelledby="today-summary">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="today-summary" className="text-xl font-extrabold tracking-tight md:text-2xl">
                오늘 요약
              </h2>
              <p className="mt-1 text-sm text-gray-500">오늘 필요한 정보를 한눈에 확인합니다.</p>
            </div>
          </div>
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

        <section aria-labelledby="management-menu">
          <div className="mb-4">
            <h2 id="management-menu" className="text-xl font-extrabold tracking-tight md:text-2xl">
              관리 메뉴
            </h2>
            <p className="mt-1 text-sm text-gray-500">예약 운영에 필요한 기능으로 이동합니다.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MenuCard
              href="/owner"
              number="01"
              title="오늘"
              description="오늘 예약과 다음 일정을 확인합니다."
            />

            <MenuCard
              href="/reservations"
              number="02"
              title="예약"
              description="전체 예약을 확인하고 취소 상태를 관리합니다."
            />

            <MenuCard
              href="/settings/services"
              number="03"
              title="서비스"
              description="예약 가능한 서비스를 관리합니다."
            />

            <MenuCard
              href="/settings/profile"
              number="04"
              title="설정"
              description="기본정보와 예약 링크 설정을 관리합니다."
            />
          </div>
        </section>
      </div>
    </main>
  );
}
