import { supabase } from "@/lib/supabase/client";
import type { LinkTheme } from "@/features/booking/themes";
import type {
  BookingSlotIntervalMinutes,
  BookingSlotMode,
} from "@/features/booking/slotMode";

export type Organization = {
  id: string;
  handle: string;
  name: string | null;
  display_name: string | null;
  created_at: string;

  // ✅ 추가
  location_text: string | null;
  notice_text: string | null;
  booking_notice: string | null;
  booking_contact: string | null;
  link_theme: LinkTheme | null;
  booking_slot_mode: BookingSlotMode | null;
  booking_slot_interval_min: BookingSlotIntervalMinutes | null;
  booking_enabled: boolean | null;
  withdrawal_requested_at: string | null;
  disabled_at: string | null;
};

export async function fetchOrganizationByHandle(handle: string): Promise<Organization | null> {
  const { data, error } = await supabase.rpc("get_public_organization_by_handle", {
    p_handle: handle,
  });

  if (error) {
    console.error(error);
    return null;
  }

  const row = Array.isArray(data) ? data[0] ?? null : data;
  return (row as Organization | null) ?? null;
}
