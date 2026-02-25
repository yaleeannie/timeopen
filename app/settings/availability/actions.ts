"use server";

import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { WEEKDAYS, type AvailabilityFormState } from "../../../features/availability/types";

/* ------------------ helpers ------------------ */

function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(":").map(Number);
  return hh * 60 + mm;
}

function validateDay(day: any, label: string) {
  if (!day.open) return;

  const ws = timeToMinutes(day.work_start);
  const we = timeToMinutes(day.work_end);
  if (!(ws < we)) throw new Error(`${label}: work_start < work_end 여야 합니다.`);

  const hasBreak = !!day.break_start || !!day.break_end;
  if (!hasBreak) return;

  if (!day.break_start || !day.break_end) {
    throw new Error(`${label}: break_start/break_end 를 모두 입력하세요.`);
  }

  const bs = timeToMinutes(day.break_start);
  const be = timeToMinutes(day.break_end);

  if (!(bs < be)) throw new Error(`${label}: break_start < break_end 여야 합니다.`);
  if (bs < ws || be > we) {
    throw new Error(`${label}: break 는 work 범위 안에서만 허용됩니다.`);
  }
}

/* ------------------ main ------------------ */

export async function saveAvailability(
  organizationId: string,
  state: AvailabilityFormState
) {
  if (!organizationId) {
    throw new Error("organizationId is required");
  }

  for (const { key, label } of WEEKDAYS) {
    validateDay(state[key], label);
  }

  const supabase = createSupabaseServerClient();

  const payload = WEEKDAYS.map(({ key, weekday }) => {
    const d = state[key];

    if (!d.open) {
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

    return {
      organization_id: organizationId,
      weekday,
      is_open: true,
      work_start: d.work_start,
      work_end: d.work_end,
      break_start: d.break_start || null,
      break_end: d.break_end || null,
    };
  });

  console.log("UPSERT PAYLOAD:", payload);

const { data, error } = await supabase
  .from("organization_availability")
  .upsert(payload, { onConflict: "organization_id,weekday" })
  .select();   // 🔥 이 줄 추가

console.log("UPSERT RESULT:", data, error);

  if (error) {
    console.error("saveAvailability error:", error);
    throw new Error(error.message);
  }

  return { ok: true };
}