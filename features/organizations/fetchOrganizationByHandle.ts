import { supabase } from "@/lib/supabase/client";

export type Organization = {
  id: string;
  handle: string;
  display_name: string | null;
  created_at: string;

  // ✅ 추가
  location_text: string | null;
  notice_text: string | null;
};

export async function fetchOrganizationByHandle(handle: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, handle, display_name, created_at, location_text, notice_text")
    .eq("handle", handle)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return (data as Organization | null) ?? null;
}