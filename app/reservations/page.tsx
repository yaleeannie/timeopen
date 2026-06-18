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
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        padding: "24px 16px 48px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 760, margin: "0 auto" }}>
        <header style={{ marginBottom: 24 }}>
          <a
            href="/owner"
            style={{
              display: "inline-block",
              marginBottom: 14,
              color: "#6b7280",
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ← 대시보드
          </a>

          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em" }}>
            예약 일정
          </div>
          <div style={{ marginTop: 7, color: "#6b7280", fontSize: 14, lineHeight: 1.5 }}>
            날짜별 예약 일정과 고객 정보를 확인할 수 있습니다.
          </div>
          <div style={{ marginTop: 10, color: "#9ca3af", fontSize: 12 }}>
            {handle ? `@${handle}` : "예약 일정"} · 전체 {reservationRows.length}건
          </div>
        </header>

        <section
          style={{
            marginBottom: 28,
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            background: "#fff",
            padding: 16,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
          aria-label="예약 날짜 선택"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <a
              href={`/reservations?date=${previousWeek}`}
              aria-label="이전 주"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                color: "#4b5563",
                padding: "7px 10px",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              ‹
            </a>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 900 }}>
                {formatCalendarMonth(calendarStart, calendarEnd)}
              </div>
              {selectedDate !== todayISO ? (
                <a
                  href={`/reservations?date=${todayISO}`}
                  style={{
                    display: "inline-block",
                    marginTop: 3,
                    color: "#2563eb",
                    fontSize: 12,
                    fontWeight: 800,
                    textDecoration: "none",
                  }}
                >
                  오늘로 이동
                </a>
              ) : (
                <div style={{ marginTop: 3, color: "#9ca3af", fontSize: 12 }}>
                  오늘
                </div>
              )}
            </div>

            <a
              href={`/reservations?date=${nextWeek}`}
              aria-label="다음 주"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                color: "#4b5563",
                padding: "7px 10px",
                textDecoration: "none",
                fontWeight: 900,
              }}
            >
              ›
            </a>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
              gap: 6,
            }}
          >
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
                  style={{
                    minWidth: 0,
                    border: selected
                      ? "1px solid #111827"
                      : today
                        ? "1px solid #bfdbfe"
                        : "1px solid transparent",
                    borderRadius: 12,
                    background: selected ? "#111827" : today ? "#eff6ff" : "#fff",
                    color: selected ? "#fff" : "#374151",
                    padding: "8px 2px 7px",
                    textAlign: "center",
                    textDecoration: "none",
                  }}
                >
                  <div
                    style={{
                      color: selected ? "#d1d5db" : "#9ca3af",
                      fontSize: 10,
                      fontWeight: 800,
                    }}
                  >
                    {weekday}
                  </div>
                  <div style={{ marginTop: 3, fontSize: 15, fontWeight: 900 }}>{day}</div>
                  <div
                    style={{
                      minHeight: 16,
                      marginTop: 3,
                      color: selected ? "#fff" : "#2563eb",
                      fontSize: 10,
                      fontWeight: 900,
                    }}
                  >
                    {count > 0 ? `${count}건` : "·"}
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 10,
            padding: "0 2px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>
            {formatDateLabel(selectedDate)}
          </h2>
          <span style={{ flexShrink: 0, color: "#6b7280", fontSize: 13, fontWeight: 800 }}>
            {selectedReservations.length}건
          </span>
        </div>

        {selectedReservations.length === 0 ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 20,
              background: "#fff",
              padding: "42px 24px",
              textAlign: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 900 }}>
              이 날짜에는 예약이 없습니다
            </div>
            <div style={{ marginTop: 8, color: "#6b7280", fontSize: 14, lineHeight: 1.6 }}>
              캘린더에서 다른 날짜를 선택해 예약 일정을 확인해보세요.
            </div>
          </div>
        ) : (
          <section>
            <div style={{ display: "grid", gap: 8 }}>
              {selectedReservations.map(({ row, start, end, serviceName }) => (
                <article
                  key={row.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    background: "#fff",
                    padding: "12px 14px",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 9,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            color: "#111827",
                            fontSize: 17,
                            fontWeight: 900,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {formatTimeRange(start, end)}
                        </div>
                        <div
                          style={{
                            minWidth: 0,
                            color: "#374151",
                            fontSize: 14,
                            fontWeight: 800,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {serviceName === "-" ? "서비스 미지정" : serviceName}
                        </div>
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          color: "#6b7280",
                          fontSize: 13,
                          fontWeight: 600,
                          lineHeight: 1.35,
                          overflowWrap: "anywhere",
                        }}
                      >
                        {displayValue(row.customer_name)} · {displayValue(row.customer_phone)}
                      </div>
                    </div>

                    <span
                      style={{
                        flexShrink: 0,
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

                  {row.status === "confirmed" ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        marginTop: 9,
                      }}
                    >
                      <form action="/api/reservations/cancel" method="post">
                        <input type="hidden" name="reservationId" value={String(row.id)} />
                        <button
                          type="submit"
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#6b7280",
                            padding: "3px 0",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            textDecoration: "underline",
                            textUnderlineOffset: 3,
                          }}
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
      </div>
    </main>
  );
}
