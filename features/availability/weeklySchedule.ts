// features/availability/weeklySchedule.ts

export type TimeRange = {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
};

export type DayRule =
  | { closed: true }
  | {
      closed?: false;
      workWindows: TimeRange[]; // 하루 여러 근무 구간 (split shift)
      breaks: TimeRange[];      // 점심 / 휴식
    };

// JS Date.getDay(): 0=Sun ... 6=Sat
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type WeeklySchedule = Record<Weekday, DayRule>;

/**
 * DB 없이 사용하는 Mock 스케줄
 */
export const weeklySchedule: WeeklySchedule = {
  0: { closed: true }, // Sunday 휴무

  1: {
    // Monday
    workWindows: [{ start: "10:00", end: "19:00" }],
    breaks: [{ start: "13:00", end: "14:00" }],
  },

  2: {
    // Tuesday (스플릿 쉬프트 예시)
    workWindows: [
      { start: "10:00", end: "14:00" },
      { start: "15:00", end: "19:00" },
    ],
    breaks: [{ start: "14:00", end: "15:00" }],
  },

  3: { closed: true }, // Wednesday 휴무

  4: {
    // Thursday (늦게 시작)
    workWindows: [{ start: "12:00", end: "21:00" }],
    breaks: [{ start: "16:00", end: "17:00" }],
  },

  5: {
    // Friday
    workWindows: [{ start: "10:00", end: "19:00" }],
    breaks: [{ start: "13:00", end: "14:00" }],
  },

  6: {
    // Saturday (단축 근무)
    workWindows: [{ start: "10:00", end: "16:00" }],
    breaks: [],
  },
};