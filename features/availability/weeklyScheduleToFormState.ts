import type { WeeklySchedule } from "./weeklySchedule";
import type { AvailabilityFormState } from "./types";

function defaultState(): AvailabilityFormState {
  return {
    mon: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    tue: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    wed: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    thu: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    fri: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    sat: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    sun: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
  };
}

// WeeklySchedule weekday: 0=Sun ... 6=Sat (너의 fetchAvailabilityFromDb가 이 기준)
const weekdayToKey: Record<number, keyof AvailabilityFormState> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export function weeklyScheduleToFormState(ws: WeeklySchedule): AvailabilityFormState {
  const out = defaultState();

  (Object.keys(weekdayToKey) as unknown as number[]).forEach((weekday) => {
    const key = weekdayToKey[weekday];
    const rule: any = (ws as any)[weekday];

    if (!rule || rule.closed) {
      out[key] = { ...out[key], open: false, break_start: "", break_end: "" };
      return;
    }

    const work = rule.workWindows?.[0];
    const brk = rule.breaks?.[0];

    out[key] = {
      open: true,
      work_start: work?.start ?? out[key].work_start,
      work_end: work?.end ?? out[key].work_end,
      break_start: brk?.start ?? "",
      break_end: brk?.end ?? "",
    };
  });

  return out;
}