import { supabase } from "@/lib/supabase/client";
import type { WeeklySchedule, DayRule, Weekday } from "./weeklySchedule";

type AvailabilityRow = {
  weekday: number;
  work_start: string; // "HH:MM:SS"
  work_end: string;   // "HH:MM:SS"
  break_start: string | null; // "HH:MM:SS" | null
  break_end: string | null;   // "HH:MM:SS" | null
};

function toHHmm(t: string | null): string | null {
  if (!t) return null;
  // Supabase `time` usually comes back as "HH:MM:SS" (or "HH:MM:SS.sss")
  return t.slice(0, 5);
}

function emptyWeekly(): WeeklySchedule {
  return {
    0: { closed: true },
    1: { closed: true },
    2: { closed: true },
    3: { closed: true },
    4: { closed: true },
    5: { closed: true },
    6: { closed: true },
  };
}

/**
 * organization_availability 테이블을 조회해서
 * 기존 weeklySchedule(=buildDailySchedule 입력)과 동일한 형태(WeeklySchedule)로 변환한다.
 *
 * - 1 weekday = 1 row (split shift는 다음 단계)
 * - row가 없는 요일은 closed 처리
 */
export async function fetchAvailabilityFromDb(organizationId: string): Promise<WeeklySchedule> {
  const { data, error } = await supabase
    .from("organization_availability")
    .select("weekday, work_start, work_end, break_start, break_end")
    .eq("organization_id", organizationId);

  if (error) {
    console.error(error);
    return emptyWeekly();
  }

  const schedule = emptyWeekly();

  (data as AvailabilityRow[] | null)?.forEach((row) => {
    const weekday = row.weekday as Weekday;

    const workStart = toHHmm(row.work_start);
    const workEnd = toHHmm(row.work_end);

    if (!workStart || !workEnd) {
      schedule[weekday] = { closed: true };
      return;
    }

    const breakStart = toHHmm(row.break_start);
    const breakEnd = toHHmm(row.break_end);

    const dayRule: DayRule = {
      workWindows: [{ start: workStart, end: workEnd }],
      breaks:
        breakStart && breakEnd
          ? [{ start: breakStart, end: breakEnd }]
          : [],
    };

    schedule[weekday] = dayRule;
  });

  return schedule;
}