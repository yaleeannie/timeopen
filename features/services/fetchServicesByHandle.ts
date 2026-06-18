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
  const normalizedHandle = handle.trim().toLowerCase();

  if (!normalizedHandle) return [];

  const { data, error } = await supabase.rpc("get_services_by_handle", {
    p_handle: normalizedHandle,
  });

  if (error) {
    console.error("[fetchServicesByHandle]", error);
    return [];
  }

  return (data ?? []) as ServiceRow[];
}
