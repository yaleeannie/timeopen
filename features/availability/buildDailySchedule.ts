// features/availability/buildDailySchedule.ts

import { weeklySchedule, type TimeRange, type Weekday, type DayRule } from "./weeklySchedule";

export type DailySchedule = {
  workWindows: TimeRange[];
  breaks: TimeRange[];
};

function isClosed(rule: DayRule | undefined): rule is { closed: true } {
  return !rule || rule.closed === true;
}

/**
 * 선택된 날짜 → 해당 요일의 영업 스케줄 생성
 *
 * - 휴무(closed)면 빈 배열 반환
 * - 반환 시 배열을 복사(slice)해서 외부 mutation으로부터 안전하게 함
 * - (선택) 추후 date override를 적용할 수 있도록 확장 포인트를 남김
 */
export function buildDailySchedule(date: Date): DailySchedule {
  const weekday = date.getDay() as Weekday;
  const rule = weeklySchedule[weekday];

  const base: DailySchedule = isClosed(rule)
    ? { workWindows: [], breaks: [] }
    : {
        workWindows: (rule.workWindows ?? []).slice(),
        breaks: (rule.breaks ?? []).slice(),
      };

  // ✅ 나중에 특정 날짜 override를 붙일 때 여기서 처리하면 됨
  // return applyDateOverride(date, base);

  return base;
}