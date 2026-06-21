import { supabase } from "@/lib/supabase/client";

export async function fetchHolidayForDate(params: {
  handle: string;
  dateISO: string;
}) {
  const { data, error } = await supabase.rpc("get_holiday_by_handle_date", {
    p_handle: params.handle,
    p_date: params.dateISO,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;
  return row
    ? {
        isClosed: Boolean(row.is_closed),
        note: (row.note as string | null) ?? null,
      }
    : null;
}
