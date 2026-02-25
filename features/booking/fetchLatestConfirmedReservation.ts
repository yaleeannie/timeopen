import { supabase } from "@/lib/supabase/client";

type Params = {
  organizationId: string;
  dateISO: string; // YYYY-MM-DD
};

export async function fetchLatestConfirmedReservation({
  organizationId,
  dateISO,
}: Params): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("reservations")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("date", dateISO)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;

  const latest = data?.[0];
  return latest?.id ? { id: latest.id } : null;
}