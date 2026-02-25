export type WeekdayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

export const WEEKDAYS: { key: WeekdayKey; label: string; weekday: number }[] = [
  { key: "mon", label: "월", weekday: 1 },
  { key: "tue", label: "화", weekday: 2 },
  { key: "wed", label: "수", weekday: 3 },
  { key: "thu", label: "목", weekday: 4 },
  { key: "fri", label: "금", weekday: 5 },
  { key: "sat", label: "토", weekday: 6 },
  { key: "sun", label: "일", weekday: 0 },
];

export type AvailabilityDayInput = {
  open: boolean;
  work_start: string; // "HH:MM"
  work_end: string;   // "HH:MM"
  break_start: string; // "" or "HH:MM"
  break_end: string;   // "" or "HH:MM"
};

export type AvailabilityFormState = Record<WeekdayKey, AvailabilityDayInput>;