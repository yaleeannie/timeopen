import PublicBookingPage from "@/features/booking/components/PublicBookingPage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeLinkTheme } from "@/features/booking/themes";
import { normalizeBookingSlotMode } from "@/features/booking/slotMode";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function UserBookingPage({ params }: Props) {
  const { handle } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("name, display_name, location_text, notice_text, link_theme, booking_slot_mode, booking_enabled, withdrawal_requested_at, disabled_at")
    .eq("handle", handle.trim().toLowerCase())
    .maybeSingle();

  return (
    <PublicBookingPage
      handle={handle}
      linkTheme={normalizeLinkTheme(organization?.link_theme)}
      bookingSlotMode={normalizeBookingSlotMode(organization?.booking_slot_mode)}
      bookingEnabled={organization?.booking_enabled !== false}
      shopName={(organization?.name ?? organization?.display_name ?? "") as string}
      locationText={(organization?.location_text ?? "") as string}
      noticeText={(organization?.notice_text ?? "") as string}
      disabled={Boolean(organization?.withdrawal_requested_at || organization?.disabled_at)}
    />
  );
}
