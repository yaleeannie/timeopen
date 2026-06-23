import { supabase } from "@/lib/supabase/client";
import type { LinkTheme } from "@/features/booking/themes";
import type { BookingSlotMode } from "@/features/booking/slotMode";

export type Organization = {
  id: string;
  handle: string;
  name: string | null;
  display_name: string | null;
  created_at: string;

  // ✅ 추가
  location_text: string | null;
  notice_text: string | null;
  link_theme: LinkTheme | null;
  booking_slot_mode: BookingSlotMode | null;
  booking_enabled: boolean | null;
  withdrawal_requested_at: string | null;
  disabled_at: string | null;
};

export async function fetchOrganizationByHandle(handle: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, handle, name, display_name, created_at, location_text, notice_text, link_theme, booking_slot_mode, booking_enabled, withdrawal_requested_at, disabled_at")
    .eq("handle", handle)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return (data as Organization | null) ?? null;
}
