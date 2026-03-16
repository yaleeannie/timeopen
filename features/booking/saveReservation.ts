import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type Params = {
  handle: string;
  serviceId: string;
  dateISO: string;
  start: string;
  end: string;
  durationMin: number;
  bufferMin: number;
  customerName: string;
  customerPhone: string;
};

export async function saveReservation(params: Params): Promise<string> {
  const supabase = createSupabaseBrowserClient();

  const { data, error } = await supabase.rpc("create_reservation_by_handle", {
    p_handle: params.handle,
    p_service_id: params.serviceId,
    p_date: params.dateISO,
    p_start: params.start,
    p_end: params.end,
    p_duration_min: params.durationMin,
    p_buffer_min: params.bufferMin,
    p_customer_name: params.customerName,
    p_customer_phone: params.customerPhone,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rid =
  (typeof data === "string" || typeof data === "number" ? data : null) ??
  (data as any)?.id ??
  (data as any)?.reservation_id ??
  (Array.isArray(data) ? (data as any)[0]?.id ?? (data as any)[0]?.reservation_id : null);

  if (!rid) {
    throw new Error("예약은 저장됐지만 reservation id를 찾을 수 없습니다.");
  }

  return String(rid);
}