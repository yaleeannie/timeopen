export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import PublicConfirmedPage from "@/features/booking/components/PublicConfirmedPage";

type Props = {
  params: { handle: string };
  searchParams?: { rid?: string };
};

function pickReservationDateTime(r: any) {
  const date =
    r?.date ??
    r?.date_iso ??
    r?.reservation_date ??
    r?.p_date ??
    r?.day ??
    null;

  const start =
    r?.start ??
    r?.start_time ??
    r?.start_hhmm ??
    r?.p_start ??
    null;

  const end =
    r?.end ??
    r?.end_time ??
    r?.end_hhmm ??
    r?.p_end ??
    null;

  return {
    dateText: date ? String(date) : "-",
    timeText: start ? `${String(start)}${end ? ` ~ ${String(end)}` : ""}` : "-",
  };
}

export default async function ConfirmedPage({ params, searchParams }: Props) {
  const handle = params.handle;
  const rid = searchParams?.rid ? String(searchParams.rid) : "";

  const supabase = await createSupabaseServerClient();

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .select("id, handle, location_text, notice_text")
    .eq("handle", handle)
    .maybeSingle();

  let reservation: any = null;
  let reservationErrMsg: string | null = null;
  let serviceName = "-";
  let serviceNameTranslations: Record<string, string> = {};

  if (!rid) {
    reservationErrMsg = null;
  } else {
    const { data: r, error: rErr } = await supabase
      .from("reservations")
      .select(
        `
        id,
        organization_id,
        date,
        start_time,
        end_time,
        start_at,
        end_at,
        service_id,
        customer_name,
        customer_phone
        `
      )
      .eq("id", rid)
      .maybeSingle();

    if (rErr) {
      reservationErrMsg = rErr.message;
    } else {
      reservation = r ?? null;
    }

    const orgId = (org as any)?.id ?? null;
    const rOrgId = reservation?.organization_id ?? null;

    if (orgId && rOrgId && String(orgId) !== String(rOrgId)) {
      reservation = null;
      reservationErrMsg = null;
    }

    if (reservation?.service_id) {
      const { data: serviceRow } = await supabase
        .from("services")
        .select("name, name_translations")
        .eq("id", reservation.service_id)
        .maybeSingle();

      if (serviceRow?.name) {
        serviceName = String(serviceRow.name);
        serviceNameTranslations =
          serviceRow.name_translations && typeof serviceRow.name_translations === "object"
            ? (serviceRow.name_translations as Record<string, string>)
            : {};
      } else {
        serviceName = String(reservation.service_id);
      }
    }
  }

  const locationText = (org as any)?.location_text
    ? String((org as any).location_text)
    : "";
  const noticeText = (org as any)?.notice_text
    ? String((org as any).notice_text)
    : "";

  const { dateText, timeText } = reservation
    ? pickReservationDateTime(reservation)
    : { dateText: "-", timeText: "-" };

  const customerName = reservation?.customer_name
    ? String(reservation.customer_name)
    : "-";

  const customerPhone = reservation?.customer_phone
    ? String(reservation.customer_phone)
    : "-";

  return (
    <PublicConfirmedPage
      handle={handle}
      dateText={dateText}
      timeText={timeText}
      serviceName={serviceName}
      serviceNameTranslations={serviceNameTranslations}
      customerName={customerName}
      customerPhone={customerPhone}
      locationText={locationText}
      noticeText={noticeText}
      organizationFound={Boolean(org)}
      reservationFound={Boolean(reservation)}
      organizationError={orgErr?.message}
      reservationError={reservationErrMsg ?? undefined}
    />
  );
}
