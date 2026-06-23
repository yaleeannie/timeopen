import { supabase } from "@/lib/supabase/client";
import type { Organization } from "@/features/organizations/fetchOrganizationByHandle";
import { validateHandleValue } from "@/features/validation/fieldLimits";

export async function createOrganization(handle: string): Promise<Organization> {
  const validation = validateHandleValue(handle);

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({ handle: validation.value })
    .select("id, handle, display_name, created_at")
    .single();

  if (error) throw error;
  return data as Organization;
}
