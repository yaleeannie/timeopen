// features/availability/fetchBusyFromDb.ts
import { supabase } from "@/lib/supabase/client";
import type { TimeRange } from "@/features/availability/weeklySchedule";

export async function fetchBusyFromDb(params: { handle: string; dateISO: string }): Promise<TimeRange[]> {
  const { data, error } = await supabase.rpc("get_busy_by_handle_date", {
    p_handle: params.handle,
    p_date: params.dateISO,
  });

  if (error) throw error;

  return (data ?? []).map((r: any) => ({
    start: String(r.start_time).slice(0, 5),
    end: String(r.end_time).slice(0, 5),
    bufferMin: Number(r.buffer_min ?? 0) || 0,
  }));
}