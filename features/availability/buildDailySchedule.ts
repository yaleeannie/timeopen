// features/availability/buildDailySchedule.ts

import type { WeeklySchedule, TimeRange, Weekday, DayRule } from "./weeklySchedule";

export type DailySchedule = {
  workWindows: TimeRange[];
  breaks: TimeRange[];
};

function isClosed(rule: DayRule | undefined): rule is { closed: true } {
  return !rule || rule.closed === true;
}

export function buildDailySchedule(
  date: Date,
  weeklySchedule: WeeklySchedule
): DailySchedule {
  const weekday = date.getDay() as Weekday;
  const rule = weeklySchedule[weekday];

  const base: DailySchedule = isClosed(rule)
    ? { workWindows: [], breaks: [] }
    : {
        workWindows: (rule.workWindows ?? []).slice(),
        breaks: (rule.breaks ?? []).slice(),
      };

  return base;
}