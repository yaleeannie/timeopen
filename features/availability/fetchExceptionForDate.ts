// features/availability/fetchExceptionForDate.ts
import { supabase } from "@/lib/supabase/client";

export async function fetchExceptionForDate(params: { handle: string; dateISO: string }) {
  const { data, error } = await supabase.rpc("get_exception_by_handle_date", {
    p_handle: params.handle,
    p_date: params.dateISO,
  });

  if (error) throw error;

  // RPC가 jsonb 1개(or null)을 주도록 했으니까 그대로 반환
  return data ?? null;
}