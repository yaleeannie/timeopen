// features/availability/fetchAvailabilityFromDb.ts

import { supabase } from "@/lib/supabase/client";
import type { WeeklySchedule, Weekday } from "./weeklySchedule";

export async function fetchAvailabilityFromDb(args: {
  organizationId: string;
}): Promise<WeeklySchedule> {
  const { organizationId } = args;

  const { data, error } = await supabase
    .from("organization_availability")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    console.error("fetchAvailabilityFromDb error:", error);
    throw error;
  }

  // 🔴 기본값을 전부 closed 로 초기화
  const schedule: WeeklySchedule = {
    0: { closed: true },
    1: { closed: true },
    2: { closed: true },
    3: { closed: true },
    4: { closed: true },
    5: { closed: true },
    6: { closed: true },
  };

  // 🔴 DB row를 정확히 weekday 숫자에 매핑
  for (const row of data ?? []) {
    const weekday = Number(row.weekday) as Weekday;

    if (!row.is_open) {
      schedule[weekday] = { closed: true };
      continue;
    }

    schedule[weekday] = {
      closed: false,
      workWindows: [
        {
          start: row.work_start.slice(0, 5),
          end: row.work_end.slice(0, 5),
        },
      ],
      breaks:
        row.break_start && row.break_end
          ? [
              {
                start: row.break_start.slice(0, 5),
                end: row.break_end.slice(0, 5),
              },
            ]
          : [],
    };
  }

  console.log("📦 WeeklySchedule from DB:", schedule); // ← 확인용

  return schedule;
}