import { supabase } from "@/lib/supabase/client";
import type { TimeRange } from "./weeklySchedule";

type Params = {
  organizationId: string;
  dateISO: string;
};

function hhmmToMin(v: string) {
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
}

function minToHhmm(v: number) {
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* 🔥 겹치는 시간 병합 */
function mergeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length === 0) return [];

  const sorted = [...ranges].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  const merged: TimeRange[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    const currentEnd = hhmmToMin(current.end);
    const nextStart = hhmmToMin(next.start);
    const nextEnd = hhmmToMin(next.end);

    if (nextStart <= currentEnd) {
      // 겹치거나 붙어있음 → 확장
      current = {
        start: current.start,
        end: minToHhmm(Math.max(currentEnd, nextEnd)),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }

  merged.push(current);
  return merged;
}

export async function fetchBusyFromDb({
  organizationId,
  dateISO,
}: Params): Promise<TimeRange[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("start_time, end_time, buffer_min")
    .eq("organization_id", organizationId)
    .eq("date", dateISO)
    .eq("status", "confirmed")
    .order("start_time", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  const expanded = (data ?? []).map((r: any) => {
  const buffer = Number(r.buffer_min ?? 0) || 0;

  const endWithBuffer = minToHhmm(
    hhmmToMin(String(r.end_time).slice(0, 5)) + buffer
  );

  return {
    start: String(r.start_time).slice(0, 5),
    end: endWithBuffer,
  };
});

  // 🔥 여기서 병합
  return mergeRanges(expanded);
}