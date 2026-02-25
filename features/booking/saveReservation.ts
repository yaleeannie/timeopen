import { supabase } from "@/lib/supabase/client";

type Params = {
  organizationId: string;
  serviceId: string;
  dateISO: string;
  start: string;
  end: string;
  durationMin: number;
  bufferMin: number;
};

export async function saveReservation(params: Params) {
  const { error } = await supabase.from("reservations").insert({
    organization_id: params.organizationId,
    service_id: params.serviceId,
    date: params.dateISO,
    start_time: params.start,
    end_time: params.end,
    duration_min: params.durationMin,
    buffer_min: params.bufferMin,
    status: "confirmed",
  });

  if (error) throw error;
}