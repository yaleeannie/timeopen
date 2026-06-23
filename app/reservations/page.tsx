export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";

type ReservationRow = {
  id: string;
  organization_id: string;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  start_at: string | null;
  end_at: string | null;
  status: string | null;
  service_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
};

type SmsLogRow = {
  reservation_id: string | null;
  recipient_type: "owner" | "customer";
  status: "success" | "failed" | "skipped";
  created_at: string;
};

type SmsDisplayStatus = "success" | "partial" | "failed" | "none";

type Props = {
  searchParams?: {
    date?: string;
  };
};

function formatStatus(status: string | null) {
  if (!status) return "-";
  switch (status) {
    case "confirmed":
      return "확정";
    case "canceled":
      return "취소됨";
    case "cancelled":
      return "취소됨";
    default:
      return status;
  }
}

function formatSeoulPart(value: string | null, options: Intl.DateTimeFormatOptions) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    ...options,
  }).format(date);
}

function formatDateText(r: ReservationRow) {
  if (r.date) return String(r.date).slice(0, 10);

  return (
    formatSeoulPart(r.start_at, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }) ?? "-"
  );
}

function formatTimeText(value: unknown) {
  if (!value) return "-";
  return String(value).slice(0, 5);
}

function formatFallbackTime(value: string | null) {
  return (
    formatSeoulPart(value, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }) ?? "-"
  );
}

function formatDateLabel(dateISO: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return "날짜 미상";

  const [, year, month, day] = match;
  const weekday = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    weekday: "long",
  }).format(new Date(`${dateISO}T00:00:00+09:00`));

  return `${Number(year)}년 ${Number(month)}월 ${Number(day)}일 ${weekday}`;
}

function statusStyle(status: string | null) {
  if (status === "confirmed") {
    return {
      color: "#008fc0",
      background: "rgba(0, 214, 247, 0.10)",
      borderColor: "rgba(0, 193, 255, 0.42)",
    };
  }

  if (status === "cancelled" || status === "canceled") {
    return {
      color: "#6b7280",
      background: "#f3f4f6",
      borderColor: "#e5e7eb",
    };
  }

  return {
    color: "#374151",
    background: "#f9fafb",
    borderColor: "#e5e7eb",
  };
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
      return {
        color: "#008fc0",
        background: "rgba(0, 214, 247, 0.10)",
        borderColor: "rgba(0, 193, 255, 0.42)",
      };
    case "partial":
      return {
        color: "#92400e",
        background: "#fef3c7",
        borderColor: "#fde68a",
      };
    case "failed":
      return {
        color: "#b91c1c",
        background: "#fee2e2",
        borderColor: "#fecaca",
      };
    default:
      return {
        color: "#6b7280",
        background: "#f3f4f6",
        borderColor: "#e5e7eb",
      };
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

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatReservationTime(r: ReservationRow, kind: "start" | "end") {
  const direct = kind === "start" ? r.start_time : r.end_time;
  const fallback = kind === "start" ? r.start_at : r.end_at;

  if (direct) return formatTimeText(direct);
  return formatFallbackTime(fallback);
}

function formatTimeRange(start: string, end: string) {
  if (start === "-" && end === "-") return "시간 미정";
  return `${start} ~ ${end}`;
}

function getSeoulTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseISODate(dateISO: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return null;

  const date = new Date(
    Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  );

  if (
    date.getUTCFullYear() !== Number(match[1]) ||
    date.getUTCMonth() !== Number(match[2]) - 1 ||
    date.getUTCDate() !== Number(match[3])
  ) {
    return null;
  }

  return date;
}

function toISODate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function getMonthCalendar(dateISO: string) {
  const selected = parseISODate(dateISO);
  if (!selected) return null;

  const year = selected.getUTCFullYear();
  const month = selected.getUTCMonth();
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  const leadingEmptyDays = (firstDay.getUTCDay() + 6) % 7;
  const dates: Array<string | null> = Array.from(
    { length: leadingEmptyDays },
    () => null
  );

  for (let day = 1; day <= lastDay.getUTCDate(); day += 1) {
    dates.push(toISODate(new Date(Date.UTC(year, month, day))));
  }

  while (dates.length % 7 !== 0) {
    dates.push(null);
  }

  return {
    label: `${year}년 ${month + 1}월`,
    dates,
    previousMonth: toISODate(new Date(Date.UTC(year, month - 1, 1))),
    nextMonth: toISODate(new Date(Date.UTC(year, month + 1, 1))),
  };
}

export default async function ReservationsPage({ searchParams }: Props) {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, color: "#b00020" }}>
          owner 정보를 불러오지 못했습니다: {error}
        </div>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, color: "#b00020" }}>
          owner organization을 찾을 수 없습니다.
        </div>
      </div>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: rows, error: resErr } = await supabase
    .from("reservations")
    .select(
      "id, organization_id, date, start_time, end_time, start_at, end_at, status, service_id, customer_name, customer_phone"
    )
    .eq("organization_id", organizationId)
    .order("start_at", { ascending: true });

  if (resErr) {
    return (
      <div style={{ padding: 16 }}>
        <div>reservations 조회 실패: {resErr.message}</div>
      </div>
    );
  }

  const { data: services, error: svcErr } = await supabase
    .from("services")
    .select("id, name")
    .eq("organization_id", organizationId);

  if (svcErr) {
    return (
      <div style={{ padding: 16 }}>
        <div>services 조회 실패: {svcErr.message}</div>
      </div>
    );
  }

  const reservationIds = ((rows ?? []) as ReservationRow[]).map((row) => row.id);
  let smsLogs: SmsLogRow[] = [];

  if (reservationIds.length > 0) {
    const { data: smsLogRows, error: smsLogErr } = await supabase
      .from("sms_logs")
      .select("reservation_id, recipient_type, status, created_at")
      .eq("organization_id", organizationId)
      .eq("message_type", "booking_confirm")
      .in("reservation_id", reservationIds)
      .order("created_at", { ascending: false });

    if (smsLogErr) {
      console.error("[reservations] sms_logs 조회 실패", smsLogErr.message);
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

  const serviceNameMap = new Map(
    (services ?? []).map((s: any) => [String(s.id), String(s.name)])
  );

  function formatServiceName(serviceId: unknown) {
    if (!serviceId) return "-";
    const key = String(serviceId);
    return serviceNameMap.get(key) ?? key;
  }

  const reservationRows = ((rows ?? []) as ReservationRow[])
    .map((row) => {
      const date = formatDateText(row);
      const start = formatReservationTime(row, "start");
      const end = formatReservationTime(row, "end");

      return {
        row,
        date,
        start,
        end,
        serviceName: formatServiceName(row.service_id),
        smsStatus: getSmsDisplayStatus(smsLogsByReservation.get(row.id) ?? []),
      };
    })
    .sort((a, b) => {
      const dateDiff = (a.date === "-" ? "9999-99-99" : a.date).localeCompare(
        b.date === "-" ? "9999-99-99" : b.date
      );
      if (dateDiff !== 0) return dateDiff;
      return (a.start === "-" ? "99:99" : a.start).localeCompare(
        b.start === "-" ? "99:99" : b.start
      );
    });

  const groupedReservations = Array.from(
    reservationRows.reduce((groups, reservation) => {
      const group = groups.get(reservation.date) ?? [];
      group.push(reservation);
      groups.set(reservation.date, group);
      return groups;
    }, new Map<string, typeof reservationRows>())
  );

  const todayISO = getSeoulTodayISO();
  const requestedDate = searchParams?.date ?? "";
  const selectedDate = parseISODate(requestedDate) ? requestedDate : todayISO;
  const calendar = getMonthCalendar(selectedDate);
  const reservationCountByDate = reservationRows.reduce((counts, reservation) => {
    if (reservation.date !== "-") {
      counts.set(reservation.date, (counts.get(reservation.date) ?? 0) + 1);
    }
    return counts;
  }, new Map<string, number>());
  const selectedReservations = groupedReservations.find(
    ([date]) => date === selectedDate
  )?.[1] ?? [];

  return (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
        <header className="mb-6">
          <a href="/owner" className="brand-text mb-3 inline-flex min-h-11 items-center text-sm font-bold">
            ← 대시보드
          </a>
          <h1 className="text-3xl font-black tracking-[-0.04em]">예약관리</h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">날짜별 일정과 고객 정보를 확인하세요.</p>
          <p className="mt-2 text-sm text-gray-400">
            {handle ? `@${handle}` : "예약 일정"} · 전체 {reservationRows.length}건
          </p>
        </header>

        <section
          className="glass-card mb-7 rounded-[24px] p-3 sm:p-4"
          aria-label="예약 날짜 선택"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <a
              href={`/reservations?date=${calendar?.previousMonth ?? selectedDate}`}
              aria-label="이전 달"
              className="brand-outline flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-black"
            >
              ‹
            </a>

            <div className="min-w-0 text-center">
              <div className="truncate text-base font-black">
                {calendar?.label ?? ""}
              </div>
              {selectedDate !== todayISO ? (
                <a
                  href={`/reservations?date=${todayISO}`}
                  className="brand-text mt-1 inline-block text-sm font-bold"
                >
                  오늘로 이동
                </a>
              ) : (
                <div className="mt-1 text-sm text-gray-400">오늘</div>
              )}
            </div>

            <a
              href={`/reservations?date=${calendar?.nextMonth ?? selectedDate}`}
              aria-label="다음 달"
              className="brand-outline flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl font-black"
            >
              ›
            </a>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1" aria-hidden="true">
            {["월", "화", "수", "목", "금", "토", "일"].map((weekday) => (
              <div
                key={weekday}
                className="py-1 text-center text-[11px] font-black text-gray-400"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {(calendar?.dates ?? []).map((dateISO, index) => {
              if (!dateISO) {
                return <div key={`empty-${index}`} className="min-h-[62px]" />;
              }

              const date = parseISODate(dateISO);
              const count = reservationCountByDate.get(dateISO) ?? 0;
              const selected = dateISO === selectedDate;
              const today = dateISO === todayISO;

              return (
                <a
                  key={dateISO}
                  href={`/reservations?date=${dateISO}`}
                  aria-current={selected ? "date" : undefined}
                  className={`flex min-h-[62px] min-w-0 flex-col items-center rounded-xl border px-0.5 py-1.5 text-center ${
                    selected
                      ? "brand-selected"
                      : today
                        ? "brand-border bg-white/75 text-gray-700"
                        : "border-transparent bg-white text-gray-700"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black ${
                      today && !selected ? "brand-soft" : ""
                    }`}
                  >
                    {date?.getUTCDate()}
                  </div>
                  {count > 0 ? (
                    <div
                      className={`mt-1 rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                        selected
                          ? "bg-white/20 text-white"
                          : "brand-soft"
                      }`}
                    >
                      {count}건
                    </div>
                  ) : null}
                </a>
              );
            })}
          </div>
        </section>

        <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <h2 className="min-w-0 text-base font-black">
            {formatDateLabel(selectedDate)}
          </h2>
          <span className="brand-chip shrink-0 rounded-full px-2.5 py-1 text-xs font-bold">
            {selectedReservations.length}건
          </span>
        </div>

        {selectedReservations.length === 0 ? (
          <div className="glass-card rounded-[24px] px-5 py-10 text-center">
            <div className="brand-soft mx-auto flex h-11 w-11 items-center justify-center rounded-2xl text-xl">
              ◷
            </div>
            <div className="mt-3 text-base font-black">이 날짜에는 예약이 없어요.</div>
            <div className="mt-1 text-sm leading-6 text-gray-500">
              캘린더에서 다른 날짜를 선택해 예약 일정을 확인해보세요.
            </div>
          </div>
        ) : (
          <section aria-label="선택한 날짜 예약">
            <div className="relative space-y-2.5 before:absolute before:bottom-5 before:left-[35px] before:top-5 before:w-px before:bg-gradient-to-b before:from-[#00d6f7]/15 before:via-[#00c1ff]/60 before:to-[#00c1ff]/15">
              {selectedReservations.map(({ row, start, end, serviceName, smsStatus }) => (
                <div
                  key={row.id}
                  className="relative grid min-w-0 grid-cols-[70px_1fr] gap-2"
                >
                  <div className="relative z-10 pt-4 text-center">
                    <div className="brand-outline inline-flex min-h-8 items-center rounded-full px-2 text-xs font-black shadow-sm backdrop-blur-xl">
                      {start}
                    </div>
                  </div>

                  <article
                    className={`glass-card min-w-0 rounded-[20px] p-3.5 ${
                      row.status === "cancelled" || row.status === "canceled"
                        ? "opacity-60"
                        : ""
                    }`}
                  >
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-black text-slate-900">
                          {displayValue(row.customer_name)}
                        </div>
                        <div className="mt-0.5 truncate text-xs font-bold text-slate-500">
                          {serviceName === "-" ? "서비스 미지정" : serviceName}
                        </div>
                      </div>

                      <span
                        style={{
                          border: "1px solid",
                          borderRadius: 999,
                          padding: "3px 7px",
                          fontSize: 11,
                          fontWeight: 800,
                          ...statusStyle(row.status),
                        }}
                      >
                        {formatStatus(row.status)}
                      </span>
                    </div>

                    <div className="mt-3 flex min-w-0 items-center justify-between gap-2">
                      <span className="truncate text-xs font-bold text-slate-400">
                        {formatTimeRange(start, end)}
                      </span>
                      <span
                        style={{
                          border: "1px solid",
                          borderRadius: 999,
                          padding: "3px 7px",
                          fontSize: 11,
                          fontWeight: 800,
                          ...smsStatusStyle(smsStatus),
                        }}
                      >
                        {smsStatusLabel(smsStatus)}
                      </span>
                    </div>

                    <div className="mt-2 flex min-w-0 items-center justify-between gap-2 border-t border-white/70 pt-2">
                      <span className="min-w-0 truncate text-xs font-medium text-slate-500">
                        {displayValue(row.customer_phone)}
                      </span>
                      {row.status === "confirmed" ? (
                        <form action="/api/reservations/cancel" method="post">
                          <input
                            type="hidden"
                            name="reservationId"
                            value={String(row.id)}
                          />
                          <button
                            type="submit"
                            className="min-h-9 shrink-0 rounded-xl px-2.5 text-xs font-bold text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                          >
                            예약 취소
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </section>
        )}
        <nav className="brand-nav mt-7 grid grid-cols-4 gap-1 rounded-2xl p-2">
          <a href="/owner" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">대시보드</a>
          <a href="/reservations" className="brand-chip flex min-h-11 items-center justify-center rounded-xl text-sm font-black">예약관리</a>
          <a href="/settings/services" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">서비스</a>
          <a href="/settings/profile" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">샵 프로필</a>
        </nav>
        </div>
      </div>
    </main>
  );
}
