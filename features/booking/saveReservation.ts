// features/booking/saveReservation.ts
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type Params = {
  handle: string;

  serviceId: string;
  dateISO: string; // "YYYY-MM-DD"
  start: string;   // "HH:MM"
  end: string;     // "HH:MM"

  durationMin: number;
  bufferMin: number;

  name: string;
  contact: string;
};

export async function saveReservation(params: Params) {
  const supabase = createSupabaseBrowserClient();

  // ✅ RPC로 insert (org_id를 클라이언트가 직접 넘기지 않음)
  const { data, error } = await supabase.rpc("create_reservation_by_handle", {
    p_handle: params.handle,
    p_service_id: params.serviceId,
    p_date: params.dateISO,
    p_start: params.start,
    p_end: params.end,
    p_duration_min: params.durationMin,
    p_buffer_min: params.bufferMin,
    p_name: params.name,
    p_contact: params.contact,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}