// features/availability/buildDailySchedule.ts
// Rule: weekly → exception(단일 override) → dailySchedule(파생). dailySchedule 저장 금지.

import type {
  WeeklySchedule,
  TimeRange,
  Weekday,
  DayRule,
} from "./weeklySchedule";

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
  if (exception) {
    if (exception.is_closed) {
      return { workWindows: [], breaks: [] };
    }

    return {
      workWindows: (exception.work_windows ?? []).slice(),
      breaks: (exception.breaks ?? []).slice(),
    };
  }

  return base;
}