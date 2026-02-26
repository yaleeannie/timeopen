// features/availability/saveAvailabilityToDb.ts

import { supabase } from "@/lib/supabase/client";
import type { WeeklySchedule, Weekday } from "./weeklySchedule";

type Row = {
  organization_id: string;
  weekday: number;
  is_open: boolean;
  work_start: string | null;
  work_end: string | null;
  break_start: string | null;
  break_end: string | null;
};

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

function assertValidRange(label: string, start: string | null, end: string | null) {
  // 닫힘/비어있음이면 검증 스킵 (예: 휴무일)
  if (!start || !end) return;

  const s = hhmmToMin(start);
  const e = hhmmToMin(end);

  if (!(e > s)) {
    throw new Error(`${label}: end must be > start (${start}~${end})`);
  }
}

function toRow(
  organizationId: string,
  weekday: Weekday,
  rule: WeeklySchedule[Weekday]
): Row {
  // closed day
  if (!rule || rule.closed) {
    return {
      organization_id: organizationId,
      weekday,
      is_open: false,
      work_start: null,
      work_end: null,
      break_start: null,
      break_end: null,
    };
  }

  const work = rule.workWindows?.[0] ?? null;
  const brk = rule.breaks?.[0] ?? null;

  const work_start = work?.start ?? null;
  const work_end = work?.end ?? null;
  const break_start = brk?.start ?? null;
  const break_end = brk?.end ?? null;

  // ✅ 입력 검증 (잘못된 값은 저장 금지)
  assertValidRange("work_window", work_start, work_end);
  assertValidRange("break_window", break_start, break_end);

  return {
    organization_id: organizationId,
    weekday,
    is_open: true,
    work_start,
    work_end,
    break_start,
    break_end,
  };
}

export async function saveAvailabilityToDb(args: {
  organizationId: string;
  weeklySchedule: WeeklySchedule;
}) {
  const { organizationId, weeklySchedule } = args;

  const rows: Row[] = [];

  for (let d = 0 as Weekday; d <= 6; d++) {
    rows.push(toRow(organizationId, d, weeklySchedule[d]));
  }

  const { error } = await supabase
    .from("organization_availability")
    .upsert(rows, { onConflict: "organization_id,weekday" });

  if (error) {
    console.error("saveAvailabilityToDb error:", error);
    throw error;
  }
}