"use client";

import { useMemo, useRef, useState } from "react";
import LogoutButton from "./LogoutButton";

export type SmsDisplayStatus = "success" | "partial" | "failed" | "none";

export type ScheduleDate = {
  iso: string;
  weekday: string;
  day: number;
  month: number;
};

export type DashboardReservation = {
  id: string;
  date: string;
  start: string;
  end: string;
  customer: string;
  service: string;
  status: string;
  smsStatus: SmsDisplayStatus;
};

export type IncompleteSetting = {
  title: string;
  href: string;
};

type Props = {
  storeName: string;
  greeting: string;
  todayISO: string;
  todayDateText: string;
  scheduleDates: ScheduleDate[];
  reservations: DashboardReservation[];
  thisWeekReservationCount: number;
  incompleteSettings: IncompleteSetting[];
  bookingUrl: string;
  canLink: boolean;
};

function statusLabel(status: string) {
  if (status === "confirmed") return "확정";
  if (status === "cancelled" || status === "canceled") return "취소";
  return status;
}

function statusStyle(status: string) {
  if (status === "confirmed") return "border-[#b9eedf] bg-[#e9faf5] text-[#16866f]";
  if (status === "cancelled" || status === "canceled") {
    return "border-gray-200 bg-gray-100 text-gray-500";
  }
  return "border-[#dcecef] bg-[#f5fafb] text-gray-600";
}

function smsStatusLabel(status: SmsDisplayStatus) {
  if (status === "success") return "문자 완료";
  if (status === "partial") return "문자 일부";
  if (status === "failed") return "문자 실패";
  return "문자 없음";
}

function smsStatusStyle(status: SmsDisplayStatus) {
  if (status === "success") return "border-[#99f6e4] bg-[#ccfbf1] text-[#0f766e]";
  if (status === "partial") return "border-[#fde68a] bg-[#fef3c7] text-[#92400e]";
  if (status === "failed") return "border-[#fecaca] bg-[#fee2e2] text-[#b91c1c]";
  return "border-gray-200 bg-gray-100 text-gray-500";
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex min-h-20 min-w-0 flex-col justify-between rounded-2xl border border-[#e2eff1] bg-white p-3 shadow-sm transition hover:border-[#a9e2ea] hover:bg-[#f8fcfd]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8f9fb] text-sm font-black text-[#168ca8]">
        {icon}
      </span>
      <span className="truncate text-xs font-black text-gray-700">{label}</span>
    </a>
  );
}

export default function OwnerDashboardClient({
  storeName,
  greeting,
  todayISO,
  todayDateText,
  scheduleDates,
  reservations,
  thisWeekReservationCount,
  incompleteSettings,
  bookingUrl,
  canLink,
}: Props) {
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [copyStatus, setCopyStatus] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reservationsByDate = useMemo(() => {
    const groups = new Map<string, DashboardReservation[]>();
    for (const reservation of reservations) {
      const items = groups.get(reservation.date) ?? [];
      items.push(reservation);
      groups.set(reservation.date, items);
    }
    return groups;
  }, [reservations]);

  const selectedReservations = reservationsByDate.get(selectedDate) ?? [];
  const selectedDateInfo =
    scheduleDates.find((date) => date.iso === selectedDate) ?? scheduleDates[0];

  async function copyBookingLink() {
    if (!canLink || !bookingUrl) return;

    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopyStatus("복사됨");
    } catch {
      setCopyStatus("복사 실패");
    }

    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(""), 1600);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f7] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[30px] bg-[#f9fcfc] shadow-[0_22px_60px_rgba(67,124,138,0.14)] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-black text-[#1ba7c3]">{greeting}</div>
              <h1 className="mt-1 truncate text-2xl font-black tracking-[-0.035em] text-gray-950">
                {storeName} 사장님
              </h1>
              <p className="mt-1 text-sm font-medium text-gray-500">{todayDateText}</p>
            </div>
            <LogoutButton />
          </header>

          <section className="mt-5 grid grid-cols-2 gap-2.5" aria-label="대시보드 요약">
            <div className="rounded-2xl bg-gradient-to-br from-[#35c5df] to-[#23afd0] p-4 text-white shadow-[0_10px_24px_rgba(35,175,208,0.2)]">
              <div className="text-xs font-bold text-cyan-50">이번 주 예약</div>
              <div className="mt-1 text-2xl font-black">
                {thisWeekReservationCount}
                <span className="ml-1 text-sm">건</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#e4eef0] bg-white p-4 shadow-sm">
              <div className="text-xs font-bold text-gray-400">미완료 설정</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-gray-900">
                  {incompleteSettings.length}
                </span>
                <span className="text-sm font-bold text-gray-500">개</span>
              </div>
            </div>
          </section>

          <section className="mt-2.5 rounded-2xl border border-[#e2eff1] bg-white px-3.5 py-3 shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-black text-[#168ca8]">예약 링크</div>
                <div className="mt-0.5 truncate text-xs font-bold text-gray-500">
                  {canLink ? bookingUrl : "예약 링크 설정이 필요해요"}
                </div>
              </div>
              {canLink ? (
                <button
                  type="button"
                  onClick={copyBookingLink}
                  className="min-h-9 shrink-0 rounded-xl bg-[#e9f9fb] px-3 text-xs font-black text-[#168ca8]"
                >
                  {copyStatus || "복사"}
                </button>
              ) : (
                <a
                  href="/settings/profile"
                  className="flex min-h-9 shrink-0 items-center rounded-xl bg-[#e9f9fb] px-3 text-xs font-black text-[#168ca8]"
                >
                  만들기
                </a>
              )}
            </div>
          </section>

          {incompleteSettings.length > 0 ? (
            <section className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
              <span className="shrink-0 text-xs font-black text-[#a06c20]">설정 필요</span>
              {incompleteSettings.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-[#f0dfb9] bg-[#fffaf0] px-3 py-2 text-xs font-black text-[#9a681e]"
                >
                  {item.title} →
                </a>
              ))}
            </section>
          ) : null}

          <section className="mt-6" aria-label="날짜 선택">
            <div className="mb-3 flex items-end justify-between px-1">
              <div>
                <h2 className="text-lg font-black tracking-[-0.025em]">일정</h2>
                <p className="mt-0.5 text-xs font-medium text-gray-400">
                  오늘부터 7일간의 예약이에요.
                </p>
              </div>
              <a href="/reservations" className="text-xs font-black text-[#1aa9c7]">
                전체 보기
              </a>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {scheduleDates.map((date) => {
                const selected = date.iso === selectedDate;
                const today = date.iso === todayISO;
                const count = (reservationsByDate.get(date.iso) ?? []).filter(
                  (reservation) =>
                    reservation.status !== "cancelled" && reservation.status !== "canceled"
                ).length;

                return (
                  <button
                    key={date.iso}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`${date.month}월 ${date.day}일 ${date.weekday}요일, 예약 ${count}건`}
                    onClick={() => setSelectedDate(date.iso)}
                    className={`flex min-h-[72px] min-w-0 flex-col items-center justify-center rounded-2xl border transition ${
                      selected
                        ? "border-[#28b9dc] bg-[#28b9dc] text-white shadow-[0_8px_18px_rgba(40,185,220,0.22)]"
                        : today
                          ? "border-[#bcebf2] bg-[#edfafc] text-gray-800"
                          : "border-[#e6eff1] bg-white text-gray-600"
                    }`}
                  >
                    <span className={`text-[10px] font-black ${selected ? "text-white/80" : "text-gray-400"}`}>
                      {date.weekday}
                    </span>
                    <span className="mt-1 text-base font-black">{date.day}</span>
                    <span
                      className={`mt-1 min-h-1.5 text-[9px] font-black ${
                        selected ? "text-white" : "text-[#18a8c3]"
                      }`}
                    >
                      {count > 0 ? `${count}건` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-6" aria-labelledby="selected-schedule">
            <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
              <h2 id="selected-schedule" className="text-base font-black">
                {selectedDate === todayISO
                  ? "오늘 일정"
                  : `${selectedDateInfo.month}월 ${selectedDateInfo.day}일 일정`}
              </h2>
              <span className="text-xs font-bold text-gray-400">
                {selectedReservations.length}건
              </span>
            </div>

            {selectedReservations.length === 0 ? (
              <div className="rounded-[24px] border border-[#e2eff1] bg-white px-5 py-10 text-center shadow-sm">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf9fa] text-xl text-[#28b9dc]">
                  ◷
                </div>
                <div className="mt-3 text-sm font-black text-gray-800">
                  이 날짜에는 예약이 없어요.
                </div>
                <div className="mt-1 text-xs font-medium text-gray-400">
                  다른 날짜를 눌러 일정을 확인해보세요.
                </div>
              </div>
            ) : (
              <div className="relative space-y-2.5 before:absolute before:bottom-5 before:left-[35px] before:top-5 before:w-px before:bg-[#dcecef]">
                {selectedReservations.map((reservation) => (
                  <a
                    key={reservation.id}
                    href={`/reservations?date=${selectedDate}`}
                    className="relative grid min-w-0 grid-cols-[70px_1fr] gap-2"
                  >
                    <div className="relative z-10 pt-4 text-center">
                      <div className="inline-flex min-h-8 items-center rounded-full border border-[#cdebf0] bg-[#f4fbfc] px-2 text-xs font-black text-[#168ca8]">
                        {reservation.start}
                      </div>
                    </div>
                    <article
                      className={`min-w-0 rounded-2xl border bg-white p-3.5 shadow-sm ${
                        reservation.status === "cancelled" || reservation.status === "canceled"
                          ? "border-gray-200 opacity-60"
                          : "border-[#e2eff1]"
                      }`}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-gray-900">
                            {reservation.customer}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-bold text-gray-500">
                            {reservation.service}
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black ${statusStyle(
                            reservation.status
                          )}`}
                        >
                          {statusLabel(reservation.status)}
                        </span>
                      </div>

                      <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
                        <span className="truncate text-xs font-bold text-gray-400">
                          {reservation.start}
                          {reservation.end ? ` ~ ${reservation.end}` : ""}
                        </span>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black ${smsStatusStyle(
                            reservation.smsStatus
                          )}`}
                        >
                          {smsStatusLabel(reservation.smsStatus)}
                        </span>
                      </div>
                    </article>
                  </a>
                ))}
              </div>
            )}
          </section>

          <section className="mt-7" aria-labelledby="quick-links">
            <h2 id="quick-links" className="mb-3 px-1 text-sm font-black text-gray-800">
              빠른 이동
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <QuickLink href="/reservations" icon="✓" label="예약관리" />
              <QuickLink href="/settings/services" icon="+" label="서비스" />
              <QuickLink href="/settings/availability" icon="◷" label="영업시간" />
              <QuickLink href="/settings/profile" icon="···" label="설정" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
