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
    .select("link_theme, booking_slot_mode")
    .eq("handle", handle.trim().toLowerCase())
    .maybeSingle();

  return (
    <PublicBookingPage
      handle={handle}
      linkTheme={normalizeLinkTheme(organization?.link_theme)}
      bookingSlotMode={normalizeBookingSlotMode(organization?.booking_slot_mode)}
    />
  );
}
