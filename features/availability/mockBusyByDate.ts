// features/availability/mockBusyByDate.ts

import type { TimeRange } from "./weeklySchedule";

// 날짜별 가짜 예약 데이터 (DB 대신 테스트용)
// key 형식: "YYYY-MM-DD"
export const mockBusyByDate: Record<string, TimeRange[]> = {
  // 예시:
  // "2026-02-20": [{ start: "11:00", end: "12:00" }],
};

export function getMockBusy(dateISO: string | null): TimeRange[] {
  if (!dateISO) return [];

  // 특정 날짜에 설정 없으면 기본 더미 예약
  return mockBusyByDate[dateISO] ?? [{ start: "15:00", end: "16:00" }];
}
