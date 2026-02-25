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

function toRow(
  organizationId: string,
  weekday: Weekday,
  rule: WeeklySchedule[Weekday]
): Row {
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

  const work = rule.workWindows?.[0];
  const brk = rule.breaks?.[0];

  return {
    organization_id: organizationId,
    weekday,
    is_open: true,
    work_start: work?.start ?? null,
    work_end: work?.end ?? null,
    break_start: brk?.start ?? null,
    break_end: brk?.end ?? null,
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