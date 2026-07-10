import PublicBookingPage from "@/features/booking/components/PublicBookingPage";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeLinkTheme } from "@/features/booking/themes";
import { normalizeBookingSlotInterval } from "@/features/booking/slotMode";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Props = {
  params: Promise<{ handle: string }>;
};

export default async function UserBookingPage({ params }: Props) {
  const { handle } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_public_organization_by_handle", {
    p_handle: handle,
  });
  const organization = Array.isArray(data) ? data[0] ?? null : data;

  return (
    <PublicBookingPage
      handle={handle}
      organizationFound={Boolean(organization)}
      linkTheme={normalizeLinkTheme(organization?.link_theme)}
      bookingSlotIntervalMin={normalizeBookingSlotInterval(
        organization?.booking_slot_interval_min
      )}
      bookingEnabled={organization?.booking_enabled !== false}
      organizationId={(organization?.id ?? "") as string}
      shopName={(organization?.name ?? organization?.display_name ?? "") as string}
      locationText={(organization?.location_text ?? "") as string}
      noticeText={(organization?.notice_text ?? "") as string}
      bookingNoticeText={(organization?.booking_notice ?? "") as string}
      disabled={Boolean(organization?.withdrawal_requested_at || organization?.disabled_at)}
    />
  );
}
