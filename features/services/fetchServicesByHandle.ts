import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type ServiceRow = {
  id: string;
  organization_id: string;
  name: string;
  duration_min: number;
  price: number | null;
  active: boolean;
};

export async function fetchServicesByHandle(handle: string): Promise<ServiceRow[]> {
  const supabase = createSupabaseBrowserClient();

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (orgErr || !org?.id) {
    return [];
  }

  const { data, error } = await supabase
    .from("services")
    .select("id, organization_id, name, duration_min, price, active")
    .eq("organization_id", org.id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return data as ServiceRow[];
}