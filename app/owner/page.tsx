export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { getSiteUrl } from "@/lib/siteUrl";
import { getPlanDisplay } from "@/features/billing/planStatus";
import { filterDashboardScheduleReservations } from "./dashboardSchedule";
import OwnerDashboardClient, {
  type DashboardReservation,
  type IncompleteSetting,
  type ScheduleDate,
  type SmsDisplayStatus,
} from "./OwnerDashboardClient";

const SITE_URL = getSiteUrl();

type ReservationRow = {
  id: string;
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

function getSeoulTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getSeoulHour() {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date())
  );
}

function greetingForHour(hour: number) {
  if (hour < 12) return "좋은 아침이에요";
  if (hour < 18) return "좋은 오후예요";
  return "오늘도 수고하셨어요";
}

function parseISODate(dateISO: string) {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toISODate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
    date.getUTCDate()
  ).padStart(2, "0")}`;
}

function addDays(dateISO: string, days: number) {
  const date = parseISODate(dateISO);
  date.setUTCDate(date.getUTCDate() + days);
  return toISODate(date);
}

function getWeekRange(todayISO: string) {
  const today = parseISODate(todayISO);
  const mondayOffset = (today.getUTCDay() + 6) % 7;
  return {
    start: addDays(todayISO, -mondayOffset),
    end: addDays(todayISO, 6 - mondayOffset),
  };
}

function getScheduleDates(todayISO: string): ScheduleDate[] {
  return Array.from({ length: 7 }, (_, index) => {
    const iso = addDays(todayISO, index);
    const date = parseISODate(iso);
    return {
      iso,
      weekday: new Intl.DateTimeFormat("ko-KR", {
        timeZone: "UTC",
        weekday: "short",
      })
        .format(date)
        .replace("요일", ""),
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
    };
  });
}

function formatReservationTime(value: string | null, fallback: string | null) {
  if (value) return value.slice(0, 5);
  if (!fallback) return "";

  const date = new Date(fallback);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
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

export default async function OwnerPage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) redirect("/login");
  if (error || !organizationId) redirect("/onboarding?setup=retry");

  const supabase = await createSupabaseServerClient();
  const todayISO = getSeoulTodayISO();
  const scheduleDates = getScheduleDates(todayISO);
  const scheduleEndISO = scheduleDates.at(-1)?.iso ?? todayISO;
  const weekRange = getWeekRange(todayISO);
  const queryStart = weekRange.start < todayISO ? weekRange.start : todayISO;
  const queryEnd = weekRange.end > scheduleEndISO ? weekRange.end : scheduleEndISO;

  const [orgResult, serviceCountResult, openDayCountResult, reservationsResult, servicesResult] =
    await Promise.all([
      supabase
        .from("organizations")
        .select(
          "name, handle, plan_type, subscription_status, trial_ends_at, beta_ends_at, billing_starts_at"
        )
        .eq("id", organizationId)
        .maybeSingle(),
      supabase
        .from("services")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("active", true),
      supabase
        .from("organization_availability")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("is_open", true),
      supabase
        .from("reservations")
        .select(
          "id, date, start_time, end_time, start_at, end_at, status, service_id, customer_name, customer_phone"
        )
        .eq("organization_id", organizationId)
        .gte("date", queryStart)
        .lte("date", queryEnd)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
      supabase
        .from("services")
        .select("id, name")
        .eq("organization_id", organizationId),
    ]);

  if (orgResult.error) {
    return (
      <main className="min-h-screen bg-[#eef6f8] px-5 py-10">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-5 font-bold text-red-700">
          매장 정보를 불러오지 못했습니다: {orgResult.error.message}
        </div>
      </main>
    );
  }

  if (reservationsResult.error) {
    console.error("[owner] reservations 조회 실패", reservationsResult.error.message);
  }
  if (servicesResult.error) {
    console.error("[owner] services 조회 실패", servicesResult.error.message);
  }
  if (serviceCountResult.error) {
    console.error("[owner] active service count failed", serviceCountResult.error.message);
  }
  if (openDayCountResult.error) {
    console.error("[owner] open day count failed", openDayCountResult.error.message);
  }

  const orgRow = orgResult.data;
  const storeName = (orgRow?.name as string | null)?.trim() || "TimeOpen";
  const finalHandle = (orgRow?.handle as string | null) ?? handle;
  const planDisplay = getPlanDisplay({
    plan_type: orgRow?.plan_type as string | null | undefined,
    subscription_status: orgRow?.subscription_status as string | null | undefined,
    trial_ends_at: orgRow?.trial_ends_at as string | null | undefined,
    beta_ends_at: orgRow?.beta_ends_at as string | null | undefined,
    billing_starts_at: orgRow?.billing_starts_at as string | null | undefined,
  });
  const canLink =
    typeof finalHandle === "string" &&
    finalHandle.trim().length > 0 &&
    finalHandle !== "null";
  const bookingUrl = canLink ? `${SITE_URL}/u/${finalHandle}` : "";

  const incompleteSettings: IncompleteSetting[] = [
    (serviceCountResult.count ?? 0) === 0
      ? { title: "서비스", href: "/settings/services" }
      : null,
    (openDayCountResult.count ?? 0) === 0
      ? { title: "영업시간", href: "/settings/availability" }
      : null,
    !canLink ? { title: "인스타 예약 링크", href: "/settings/profile" } : null,
  ].filter((item): item is IncompleteSetting => Boolean(item));

  const reservationRows = (reservationsResult.data ?? []) as ReservationRow[];
  const reservationIds = reservationRows.map((row) => row.id);
  let smsLogs: SmsLogRow[] = [];

  if (reservationIds.length > 0) {
    const { data, error: smsError } = await supabase
      .from("sms_logs")
      .select("reservation_id, recipient_type, status, created_at")
      .eq("organization_id", organizationId)
      .eq("message_type", "booking_confirm")
      .in("reservation_id", reservationIds)
      .order("created_at", { ascending: false });

    if (smsError) {
      console.error("[owner] sms_logs 조회 실패", smsError.message);
    } else {
      smsLogs = (data ?? []) as SmsLogRow[];
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
    (servicesResult.data ?? []).map((service) => [
      String(service.id),
      String(service.name),
    ])
  );

  const reservations: DashboardReservation[] = reservationRows.map((row) => ({
    id: row.id,
    date: row.date ?? "",
    start: formatReservationTime(row.start_time, row.start_at) || "시간 미정",
    end: formatReservationTime(row.end_time, row.end_at),
    customer: row.customer_name?.trim() || "고객명 미입력",
    phone: row.customer_phone?.trim() || "연락처 미입력",
    service: row.service_id
      ? serviceNameMap.get(row.service_id) ?? "서비스 미지정"
      : "서비스 미지정",
    status: row.status ?? "confirmed",
    smsStatus: getSmsDisplayStatus(smsLogsByReservation.get(row.id) ?? []),
  }));
  const scheduleReservations = filterDashboardScheduleReservations(reservations);

  const thisWeekReservationCount = scheduleReservations.filter(
    (reservation) =>
      reservation.date >= weekRange.start &&
      reservation.date <= weekRange.end
  ).length;

  const todayDateText = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  return (
    <OwnerDashboardClient
      storeName={storeName}
      greeting={greetingForHour(getSeoulHour())}
      todayISO={todayISO}
      todayDateText={todayDateText}
      scheduleDates={scheduleDates}
      reservations={scheduleReservations}
      thisWeekReservationCount={thisWeekReservationCount}
      incompleteSettings={incompleteSettings}
      bookingUrl={bookingUrl}
      canLink={canLink}
      planDisplay={{
        label: planDisplay.label,
        helperText: planDisplay.helperText,
        billingNotice: planDisplay.billingNotice,
      }}
    />
  );
}
