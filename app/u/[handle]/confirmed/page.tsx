export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import PublicConfirmedPage from "@/features/booking/components/PublicConfirmedPage";
import {
  formatReservationDateKorean,
  formatReservationTimeRangeDisplay,
} from "@/features/booking/reservationDisplay";

type Props = {
  params: { handle: string };
  searchParams?: { rid?: string };
};

export default async function ConfirmedPage({ params, searchParams }: Props) {
  const handle = params.handle;
  const rid = searchParams?.rid ? String(searchParams.rid) : "";

  const supabase = await createSupabaseServerClient();
  const { data, error } = rid
    ? await supabase.rpc("get_public_reservation_confirmation", {
        p_handle: handle,
        p_reservation_id: rid,
      })
    : { data: null, error: null };

  const confirmation = Array.isArray(data) ? data[0] ?? null : data;
  const dateText = confirmation?.reservation_date
    ? formatReservationDateKorean(confirmation.reservation_date)
    : "-";
  const timeText =
    formatReservationTimeRangeDisplay(confirmation?.start_time, confirmation?.end_time) ||
    "-";

  return (
    <PublicConfirmedPage
      handle={handle}
      dateText={dateText}
      timeText={timeText}
      serviceName={confirmation?.service_name ? String(confirmation.service_name) : "-"}
      reservationStatus={
        confirmation?.reservation_status ? String(confirmation.reservation_status) : "confirmed"
      }
      serviceNameTranslations={
        confirmation?.service_name_translations &&
        typeof confirmation.service_name_translations === "object"
          ? (confirmation.service_name_translations as Record<string, string>)
          : {}
      }
      customerName={confirmation?.customer_name ? String(confirmation.customer_name) : "-"}
      customerPhone={confirmation?.customer_phone ? String(confirmation.customer_phone) : "-"}
      locationText={confirmation?.location_text ? String(confirmation.location_text) : ""}
      noticeText={confirmation?.notice_text ? String(confirmation.notice_text) : ""}
      bookingContact={confirmation?.booking_contact ? String(confirmation.booking_contact) : ""}
      bookingNotice={confirmation?.booking_notice ? String(confirmation.booking_notice) : ""}
      organizationFound
      reservationFound={Boolean(confirmation)}
      reservationError={error?.message}
    />
  );
}
