import { NextResponse } from "next/server";
import { buildDailySchedule } from "@/features/availability/buildDailySchedule";
import { computeAvailableStartTimes } from "@/features/availability/computeAvailableStartTimes";
import type { WeeklySchedule } from "@/features/availability/weeklySchedule";
import {
  getBookingSlotStepMinutes,
  normalizeBookingSlotInterval,
} from "@/features/booking/slotMode";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const toHHMM = (value: unknown) => (typeof value === "string" ? value.slice(0, 5) : "");

function convertRowsToWeeklySchedule(rows: any[]): WeeklySchedule {
  const schedule: WeeklySchedule = {
    0: { closed: true },
    1: { closed: true },
    2: { closed: true },
    3: { closed: true },
    4: { closed: true },
    5: { closed: true },
    6: { closed: true },
  };

  for (const row of rows ?? []) {
    const weekday = Number(row.weekday) as keyof WeeklySchedule;
    if (!row.is_open) {
      schedule[weekday] = { closed: true };
      continue;
    }
    schedule[weekday] = {
      closed: false,
      workWindows: [{ start: toHHMM(row.work_start), end: toHHMM(row.work_end) }],
      breaks:
        row.break_start && row.break_end
          ? [{ start: toHHMM(row.break_start), end: toHHMM(row.break_end) }]
          : [],
    };
  }

  return schedule;
}

function addMinutesToTime(value: string, minutes: number) {
  const [hour, minute] = value.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  const nextHour = Math.floor(total / 60) % 24;
  const nextMinute = total % 60;
  return `${String(nextHour).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`;
}

function getSeoulTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getSeoulNowHHMM() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const reservationId = typeof body?.reservationId === "string" ? body.reservationId : "";
  const serviceId = typeof body?.serviceId === "string" ? body.serviceId : "";
  const dateISO = typeof body?.date === "string" ? body.date : "";

  if (!serviceId || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
    return NextResponse.json({ error: "serviceId, date required" }, { status: 400 });
  }

  let organizationId = "";

  if (reservationId) {
    const { data: reservation, error: reservationError } = await supabase
      .from("reservations")
      .select("id, organization_id")
      .eq("id", reservationId)
      .maybeSingle();

    if (reservationError || !reservation) {
      return NextResponse.json({ error: "예약을 찾지 못했어요." }, { status: 404 });
    }

    organizationId = String((reservation as any).organization_id);
    const { data: member } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .in("role", ["owner", "member"])
      .maybeSingle();

    if (!member) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
  } else {
    const ownerContext = await getOwnerContext();

    if (!ownerContext.user || !ownerContext.organizationId) {
      return NextResponse.json(
        { error: ownerContext.error ?? "권한이 없습니다." },
        { status: 403 }
      );
    }

    organizationId = ownerContext.organizationId;
  }

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_min, cleanup_min")
    .eq("organization_id", organizationId)
    .eq("id", serviceId)
    .eq("active", true)
    .maybeSingle();

  if (serviceError || !service) {
    return NextResponse.json({ error: "서비스를 찾지 못했어요." }, { status: 404 });
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("booking_slot_interval_min")
    .eq("id", organizationId)
    .maybeSingle();

  const { data: holiday } = await supabase
    .from("organization_holidays")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("date", dateISO)
    .eq("type", "closed")
    .maybeSingle();

  if (holiday) {
    return NextResponse.json({ times: [] });
  }

  const { data: availabilityRows, error: availabilityError } = await supabase
    .from("organization_availability")
    .select("*")
    .eq("organization_id", organizationId);

  if (availabilityError) {
    return NextResponse.json({ error: availabilityError.message }, { status: 500 });
  }

  const { data: exception } = await supabase
    .from("organization_availability_exceptions")
    .select("is_closed, work_windows, breaks")
    .eq("organization_id", organizationId)
    .eq("date", dateISO)
    .maybeSingle();

  const busyQuery = supabase
    .from("reservations")
    .select("id, start_time, end_time, buffer_min, status")
    .eq("organization_id", organizationId)
    .eq("date", dateISO);

  if (reservationId) {
    busyQuery.neq("id", reservationId);
  }

  const { data: busyRows } = await busyQuery;

  const busy = (busyRows ?? [])
    .filter((row: any) => !["cancelled", "canceled"].includes(String(row.status ?? "confirmed")))
    .filter((row: any) => row.start_time && row.end_time)
    .map((row: any) => ({
      start: toHHMM(row.start_time),
      end: addMinutesToTime(toHHMM(row.end_time), Number(row.buffer_min ?? 0)),
    }));

  const [year, month, day] = dateISO.split("-").map(Number);
  const weekly = convertRowsToWeeklySchedule(availabilityRows ?? []);
  const daily = buildDailySchedule(new Date(year, month - 1, day), weekly, exception as any);
  const durationMin = Number((service as any).duration_min ?? 0);
  const cleanupMin = Number((service as any).cleanup_min ?? 0);
  const bookingSlotIntervalMin = normalizeBookingSlotInterval(
    (org as any)?.booking_slot_interval_min
  );
  const notBefore = dateISO === getSeoulTodayISO() ? getSeoulNowHHMM() : undefined;

  const times = computeAvailableStartTimes({
    workWindows: daily.workWindows,
    breaks: daily.breaks,
    busy,
    durationMin,
    bufferMin: cleanupMin,
    stepMin: getBookingSlotStepMinutes({
      mode: "flexible",
      durationMin,
      cleanupMin,
      intervalMin: bookingSlotIntervalMin,
    }),
    notBefore,
  });

  return NextResponse.json({ times });
}
