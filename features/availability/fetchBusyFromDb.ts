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

export async function fetchBusyFromDb({
  organizationId,
  dateISO,
}: Params): Promise<TimeRange[]> {
  const { data, error } = await supabase
    .from("reservations")
    .select("start_time, end_time, buffer_min")
    .eq("organization_id", organizationId)
    .eq("date", dateISO)
    .eq("status", "confirmed"); // ✅ confirmed만 busy로 계산

  if (error) {
    console.error(error);
    return [];
  }

  // ✅ busy는 "예약 시간 + 예약의 buffer"까지 막히도록 확장해서 반환
  return (data ?? []).map((r: any) => {
    const endWithBuffer = minToHhmm(hhmmToMin(r.end_time) + (r.buffer_min ?? 0));
    return {
      start: r.start_time,
      end: endWithBuffer,
    };
  });
}