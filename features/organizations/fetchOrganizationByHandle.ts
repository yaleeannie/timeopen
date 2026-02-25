import { supabase } from "@/lib/supabase/client";

export type Organization = {
  id: string;
  handle: string;
  display_name: string | null;
  created_at: string;
};

export async function fetchOrganizationByHandle(handle: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, handle, display_name, created_at")
    .eq("handle", handle)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return (data as Organization | null) ?? null;
}