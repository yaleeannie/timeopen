"use client";

import { useMemo, useRef, useState } from "react";
import LogoutButton from "./LogoutButton";
import OpenSlotShareCard from "./OpenSlotShareCard";

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
  if (status === "confirmed") {
    return "brand-chip";
  }
  if (status === "cancelled" || status === "canceled") {
    return "border-slate-200/70 bg-slate-100/70 text-slate-500";
  }
  return "border-[#00c1ff]/25 bg-white/55 text-slate-600";
}

function smsStatusLabel(status: SmsDisplayStatus) {
  if (status === "success") return "문자 완료";
  if (status === "partial") return "문자 일부";
  if (status === "failed") return "문자 실패";
  return "문자 없음";
}

function smsStatusStyle(status: SmsDisplayStatus) {
  if (status === "success") {
    return "brand-chip";
  }
  if (status === "partial") {
    return "border-amber-200/70 bg-amber-50/75 text-amber-700";
  }
  if (status === "failed") return "border-rose-200/70 bg-rose-50/75 text-rose-700";
  return "border-slate-200/70 bg-slate-100/65 text-slate-500";
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
      className="glass-card group flex min-h-20 min-w-0 flex-col justify-between rounded-[20px] p-3 transition hover:-translate-y-0.5 hover:bg-white/80"
    >
      <span className="brand-selected flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black transition group-hover:scale-105">
        {icon}
      </span>
      <span className="truncate text-xs font-black text-slate-700">{label}</span>
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
    <main className="soft-page-bg overflow-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-16 h-72 w-72 rounded-full bg-[#00d6f7]/20 blur-[80px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 top-48 h-80 w-80 rounded-full bg-[#00c1ff]/15 blur-[90px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-16 left-1/4 h-64 w-64 rounded-full bg-sky-200/30 blur-[85px]"
      />

      <div className="glass-shell relative mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[32px] sm:rounded-[38px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="brand-text text-sm font-black">{greeting}</div>
              <h1 className="mt-1 truncate text-2xl font-black tracking-[-0.035em] text-slate-950">
                {storeName} 사장님
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{todayDateText}</p>
            </div>
            <LogoutButton />
          </header>

          <section
            className={`mt-5 grid gap-2.5 ${
              incompleteSettings.length > 0 ? "grid-cols-2" : "grid-cols-1"
            }`}
            aria-label="대시보드 요약"
          >
            <div className="glass-card relative overflow-hidden rounded-[22px] p-4">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#00d6f7]/25 blur-2xl"
              />
              <div className="relative text-xs font-bold text-slate-500">이번 주 예약</div>
              <div className="relative mt-1 text-2xl font-black text-slate-950">
                {thisWeekReservationCount}
                <span className="ml-1 text-sm text-slate-500">건</span>
              </div>
              <div className="brand-gradient relative mt-2 h-1 w-10 rounded-full" />
            </div>

            {incompleteSettings.length > 0 ? (
              <div className="glass-card relative overflow-hidden rounded-[22px] p-4">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-10 -right-8 h-28 w-28 rounded-full bg-[#00c1ff]/18 blur-2xl"
                />
                <div className="relative text-xs font-bold text-slate-500">미완료 설정</div>
                <div className="relative mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-950">
                    {incompleteSettings.length}
                  </span>
                  <span className="text-sm font-bold text-slate-500">개</span>
                </div>
              </div>
            ) : null}
          </section>

          <section className="glass-card mt-2.5 rounded-[20px] px-3.5 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="brand-text text-[11px] font-black">인스타 예약 링크</div>
                <div className="mt-0.5 truncate text-xs font-bold text-slate-500">
                  {canLink ? bookingUrl : "인스타 프로필에 올릴 링크를 만들어주세요"}
                </div>
              </div>
              {canLink ? (
                <button
                  type="button"
                  onClick={copyBookingLink}
                  className="brand-chip min-h-9 shrink-0 rounded-xl px-3 text-xs font-black shadow-sm transition hover:bg-white"
                >
                  {copyStatus || "링크 복사"}
                </button>
              ) : (
                <a
                  href="/settings/profile"
                  className="brand-chip flex min-h-9 shrink-0 items-center rounded-xl px-3 text-xs font-black shadow-sm"
                >
                  만들기
                </a>
              )}
            </div>
          </section>

          <OpenSlotShareCard
            todayISO={todayISO}
            bookingUrl={bookingUrl}
            canLink={canLink}
          />

          {incompleteSettings.length > 0 ? (
            <section className="mt-2.5 flex items-center gap-2 overflow-x-auto rounded-[18px] border border-white/65 bg-white/30 px-3 py-2.5 backdrop-blur-lg">
              <span className="shrink-0 text-xs font-black text-amber-700/80">설정 필요</span>
              {incompleteSettings.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="shrink-0 rounded-full border border-white/80 bg-amber-50/65 px-3 py-2 text-xs font-black text-amber-700 shadow-sm"
                >
                  {item.title} →
                </a>
              ))}
            </section>
          ) : null}

          <section className="mt-6" aria-label="날짜 선택">
            <div className="mb-3 flex items-end justify-between px-1">
              <div>
                <h2 className="text-lg font-black tracking-[-0.025em] text-slate-900">일정</h2>
                <p className="mt-0.5 text-xs font-medium text-slate-400">
                  오늘부터 7일간의 예약이에요.
                </p>
              </div>
              <a
                href="/reservations"
                className="brand-outline rounded-full px-3 py-1.5 text-xs font-black backdrop-blur-md"
              >
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
                    className={`flex min-h-[72px] min-w-0 flex-col items-center justify-center rounded-[18px] border backdrop-blur-xl transition ${
                      selected
                        ? "brand-selected border-white/70"
                        : today
                          ? "brand-border bg-white/65 text-slate-800 shadow-[0_8px_22px_rgba(72,128,145,0.07)]"
                          : "border-white/70 bg-white/42 text-slate-600 shadow-[0_8px_22px_rgba(72,128,145,0.05)]"
                    }`}
                  >
                    <span className={`text-[10px] font-black ${selected ? "text-white/80" : "text-slate-400"}`}>
                      {date.weekday}
                    </span>
                    <span className="mt-1 text-base font-black">{date.day}</span>
                    <span
                      className={`mt-1 min-h-1.5 text-[9px] font-black ${
                        selected ? "text-white" : "brand-text"
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
              <span className="rounded-full border border-white/70 bg-white/35 px-2.5 py-1 text-xs font-bold text-slate-500 backdrop-blur-md">
                {selectedReservations.length}건
              </span>
            </div>

            {selectedReservations.length === 0 ? (
              <div className="rounded-[24px] border border-white/75 bg-white/45 px-5 py-10 text-center shadow-[0_14px_40px_rgba(70,105,125,0.08)] backdrop-blur-xl">
                <div className="brand-soft mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 text-xl shadow-sm">
                  ◷
                </div>
                <div className="mt-3 text-sm font-black text-slate-800">
                  이 날짜에는 예약이 없어요.
                </div>
                <div className="mt-1 text-xs font-medium text-slate-400">
                  다른 날짜를 눌러 일정을 확인해보세요.
                </div>
              </div>
            ) : (
              <div className="relative space-y-2.5 before:absolute before:bottom-5 before:left-[35px] before:top-5 before:w-px before:bg-gradient-to-b before:from-[#00d6f7]/15 before:via-[#00c1ff]/60 before:to-[#00c1ff]/15">
                {selectedReservations.map((reservation) => (
                  <a
                    key={reservation.id}
                    href={`/reservations?date=${selectedDate}`}
                    className="relative grid min-w-0 grid-cols-[70px_1fr] gap-2"
                  >
                    <div className="relative z-10 pt-4 text-center">
                      <div className="brand-outline inline-flex min-h-8 items-center rounded-full px-2 text-xs font-black shadow-sm backdrop-blur-xl">
                        {reservation.start}
                      </div>
                    </div>
                    <article
                      className={`relative min-w-0 overflow-hidden rounded-[20px] border bg-white/50 p-3.5 shadow-[0_12px_34px_rgba(70,105,125,0.08)] backdrop-blur-xl transition hover:bg-white/65 ${
                        reservation.status === "cancelled" || reservation.status === "canceled"
                          ? "border-white/60 opacity-60"
                          : "border-white/75"
                      }`}
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-black text-slate-900">
                            {reservation.customer}
                          </div>
                          <div className="mt-0.5 truncate text-xs font-bold text-slate-500">
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
                        <span className="truncate text-xs font-bold text-slate-400">
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
            <h2 id="quick-links" className="mb-3 px-1 text-sm font-black text-slate-800">
              빠른 이동
            </h2>
            <div className="grid grid-cols-4 gap-2">
              <QuickLink href="/reservations" icon="✓" label="예약관리" />
              <QuickLink href="/settings/services" icon="+" label="메뉴판" />
              <QuickLink href="/settings/availability" icon="◷" label="영업시간" />
              <QuickLink href="/settings/profile" icon="···" label="샵 프로필" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
