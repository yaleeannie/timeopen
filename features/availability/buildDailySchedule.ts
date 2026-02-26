// features/availability/buildDailySchedule.ts
// Rule: weekly → exception(단일 override) → dailySchedule(파생). dailySchedule 저장 금지.

import type { WeeklySchedule, TimeRange, Weekday, DayRule } from "./weeklySchedule";

export type DailySchedule = {
  workWindows: TimeRange[];
  breaks: TimeRange[];
};

type ExceptionDayRule = {
  is_closed: boolean;
  work_windows?: TimeRange[] | null;
  breaks?: TimeRange[] | null;
};

function isClosed(rule: DayRule | undefined): rule is { closed: true } {
  return !rule || rule.closed === true;
}

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

function isValidRange(r: { start: string; end: string }) {
  return !!r?.start && !!r?.end && hhmmToMin(r.end) > hhmmToMin(r.start);
}

export function buildDailySchedule(
  date: Date,
  weeklySchedule: WeeklySchedule,
  exception?: ExceptionDayRule | null
): DailySchedule {
  // 1) base from weekly
  const weekday = date.getDay() as Weekday;
  const weeklyRule = weeklySchedule[weekday];

  const base: DailySchedule = isClosed(weeklyRule)
    ? { workWindows: [], breaks: [] }
    : {
        workWindows: (weeklyRule.workWindows ?? []).slice(),
        breaks: (weeklyRule.breaks ?? []).slice(),
      };

  // 2) override by exception (calculation-time only)
  if (!exception) return base;

  // ✅ Closed Day = Hard Stop (work_windows 있어도 무조건 무시)
  if (exception.is_closed) {
    return { workWindows: [], breaks: [] };
  }

  // ✅ Exception 입력이 잘못되면 시스템이 깨지지 않도록 weekly로 폴백
  const exWork = (exception.work_windows ?? []).filter(isValidRange);
  const exBreaks = (exception.breaks ?? []).filter(isValidRange);

  if (exWork.length === 0) {
    return base;
  }

  return {
    workWindows: exWork.slice(),
    breaks: exBreaks.slice(),
  };
}