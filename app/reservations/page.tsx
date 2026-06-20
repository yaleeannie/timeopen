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
      color: "#166534",
      background: "#dcfce7",
      borderColor: "#bbf7d0",
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
        color: "#0f766e",
        background: "#ccfbf1",
        borderColor: "#99f6e4",
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

function addDays(dateISO: string, days: number) {
  const date = parseISODate(dateISO);
  if (!date) return dateISO;

  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

function startOfWeek(dateISO: string) {
  const date = parseISODate(dateISO);
  if (!date) return dateISO;

  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return toISODate(date);
}

function formatCalendarMonth(startISO: string, endISO: string) {
  const start = parseISODate(startISO);
  const end = parseISODate(endISO);
  if (!start || !end) return "";

  const startLabel = `${start.getUTCFullYear()}년 ${start.getUTCMonth() + 1}월`;
  const endLabel = `${end.getUTCFullYear()}년 ${end.getUTCMonth() + 1}월`;
  return startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`;
}

function formatCalendarDay(dateISO: string) {
  const date = parseISODate(dateISO);
  if (!date) return { weekday: "-", day: "-" };

  return {
    weekday: new Intl.DateTimeFormat("ko-KR", {
      timeZone: "UTC",
      weekday: "short",
    }).format(date),
    day: String(date.getUTCDate()),
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
  const calendarStart = startOfWeek(selectedDate);
  const calendarDates = Array.from({ length: 14 }, (_, index) =>
    addDays(calendarStart, index)
  );
  const calendarEnd = calendarDates[calendarDates.length - 1];
  const previousWeek = addDays(calendarStart, -7);
  const nextWeek = addDays(calendarStart, 7);
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
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f8] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] bg-[#fbfdfe] shadow-[0_20px_60px_rgba(80,145,164,0.14)] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
        <header className="mb-6">
          <a href="/owner" className="mb-3 inline-flex min-h-11 items-center text-sm font-bold text-[#28b9dc]">
            ← 오늘
          </a>
          <h1 className="text-3xl font-black tracking-[-0.04em]">예약</h1>
          <p className="mt-1 text-sm leading-5 text-gray-500">날짜별 일정과 고객 정보를 확인하세요.</p>
          <p className="mt-2 text-sm text-gray-400">
            {handle ? `@${handle}` : "예약 일정"} · 전체 {reservationRows.length}건
          </p>
        </header>

        <section
          className="mb-7 rounded-[24px] border border-[#e5f3f6] bg-white p-3 shadow-sm sm:p-4"
          aria-label="예약 날짜 선택"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <a
              href={`/reservations?date=${previousWeek}`}
              aria-label="이전 주"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dceef2] bg-white text-xl font-black text-[#5594a3]"
            >
              ‹
            </a>

            <div className="min-w-0 text-center">
              <div className="truncate text-base font-black">
                {formatCalendarMonth(calendarStart, calendarEnd)}
              </div>
              {selectedDate !== todayISO ? (
                <a
                  href={`/reservations?date=${todayISO}`}
                  className="mt-1 inline-block text-sm font-bold text-[#28b9dc]"
                >
                  오늘로 이동
                </a>
              ) : (
                <div className="mt-1 text-sm text-gray-400">오늘</div>
              )}
            </div>

            <a
              href={`/reservations?date=${nextWeek}`}
              aria-label="다음 주"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dceef2] bg-white text-xl font-black text-[#5594a3]"
            >
              ›
            </a>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map((dateISO) => {
              const { weekday, day } = formatCalendarDay(dateISO);
              const count = reservationCountByDate.get(dateISO) ?? 0;
              const selected = dateISO === selectedDate;
              const today = dateISO === todayISO;

              return (
                <a
                  key={dateISO}
                  href={`/reservations?date=${dateISO}`}
                  aria-current={selected ? "date" : undefined}
                  className={`min-w-0 rounded-xl border px-0.5 py-2 text-center ${
                    selected
                      ? "border-[#28b9dc] bg-[#28b9dc] text-white"
                      : today
                        ? "border-[#bcecf5] bg-[#eefafd] text-gray-700"
                        : "border-transparent bg-white text-gray-700"
                  }`}
                >
                  <div className={`text-[10px] font-bold ${selected ? "text-cyan-50" : "text-gray-400"}`}>
                    {weekday}
                  </div>
                  <div className="mt-0.5 text-sm font-black">{day}</div>
                  <div className={`mt-0.5 min-h-4 text-[10px] font-black ${selected ? "text-white" : "text-[#28b9dc]"}`}>
                    {count > 0 ? `${count}건` : "·"}
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
          <h2 className="min-w-0 text-base font-black">
            {formatDateLabel(selectedDate)}
          </h2>
          <span className="shrink-0 text-sm font-bold text-gray-500">
            {selectedReservations.length}건
          </span>
        </div>

        {selectedReservations.length === 0 ? (
          <div className="rounded-[24px] border border-[#e5f3f6] bg-white px-5 py-10 text-center shadow-sm">
            <div className="text-base font-black">이 날짜에는 예약이 없습니다</div>
            <div className="mt-2 text-sm leading-6 text-gray-500">
              캘린더에서 다른 날짜를 선택해 예약 일정을 확인해보세요.
            </div>
          </div>
        ) : (
          <section>
            <div className="grid gap-3">
              {selectedReservations.map(({ row, start, end, serviceName, smsStatus }) => (
                <article
                  key={row.id}
                  className="min-w-0 rounded-2xl border border-[#e5f3f6] bg-white p-4 shadow-sm"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-baseline gap-2">
                        <div className="shrink-0 text-base font-black tracking-tight">
                          {formatTimeRange(start, end)}
                        </div>
                        <div className="min-w-0 truncate text-sm font-bold text-gray-600">
                          {serviceName === "-" ? "서비스 미지정" : serviceName}
                        </div>
                      </div>

                      <div className="mt-2 text-sm font-medium leading-5 text-gray-500 [overflow-wrap:anywhere]">
                        {displayValue(row.customer_name)} · {displayValue(row.customer_phone)}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
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
                  </div>

                  {row.status === "confirmed" ? (
                    <div className="mt-3 flex justify-end">
                      <form action="/api/reservations/cancel" method="post">
                        <input type="hidden" name="reservationId" value={String(row.id)} />
                        <button
                          type="submit"
                          className="min-h-11 rounded-xl px-3 py-2 text-sm font-bold text-gray-500 underline decoration-gray-300 underline-offset-4"
                        >
                          예약 취소
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        )}
        <nav className="mt-7 grid grid-cols-4 gap-1 rounded-2xl border border-[#e5f3f6] bg-white p-2 shadow-sm">
          <a href="/owner" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">오늘</a>
          <a href="/reservations" className="flex min-h-11 items-center justify-center rounded-xl bg-[#e8f9fd] text-sm font-black text-[#20afd2]">예약</a>
          <a href="/settings/services" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">서비스</a>
          <a href="/settings/profile" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">설정</a>
        </nav>
        </div>
      </div>
    </main>
  );
}
