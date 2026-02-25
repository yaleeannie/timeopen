import { supabase } from "@/lib/supabase/client";

export async function cancelReservation(reservationId: string) {
  const { error } = await supabase
    .from("reservations")
    .update({ status: "cancelled" })
    .eq("id", reservationId);

  if (error) throw error;
}