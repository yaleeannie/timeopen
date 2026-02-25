import { supabase } from "@/lib/supabase/client";
import type { Organization } from "@/features/organizations/fetchOrganizationByHandle";

export async function createOrganization(handle: string): Promise<Organization> {
  const clean = handle.trim().toLowerCase();

  const { data, error } = await supabase
    .from("organizations")
    .insert({ handle: clean })
    .select("id, handle, display_name, created_at")
    .single();

  if (error) throw error;
  return data as Organization;
}