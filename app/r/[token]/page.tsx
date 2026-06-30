export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  formatReservationDateKorean,
  formatReservationTimeRangeDisplay,
} from "@/features/booking/reservationDisplay";
import ReservationManageClient from "./ReservationManageClient";

type Props = {
  params: { token: string };
};

export default async function ReservationManagePage({ params }: Props) {
  const token = params.token;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc(
    "get_public_reservation_by_manage_token",
    { p_token: token }
  );
  const reservation = Array.isArray(data) ? data[0] ?? null : data;

  if (error) {
    console.error("[reservation-manage] lookup failed", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
  }

  if (!reservation) {
    return (
      <main className="soft-page-bg min-h-screen overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
        <div className="glass-shell mx-auto w-full max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
          <div className="px-5 py-10 text-center">
            <div className="brand-soft mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-black">
              ?
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
              예약 정보를 찾을 수 없어요.
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              링크가 잘못되었거나 더 이상 사용할 수 없는 예약일 수 있어요.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <ReservationManageClient
      token={token}
      shopName={String(reservation.organization_name ?? "")}
      serviceName={String(reservation.service_name ?? "")}
      dateText={
        formatReservationDateKorean(reservation.reservation_date) ||
        String(reservation.reservation_date ?? "")
      }
      timeText={
        formatReservationTimeRangeDisplay(
          reservation.start_time,
          reservation.end_time
        ) || "-"
      }
      status={String(reservation.reservation_status ?? "confirmed")}
      bookingContact={String(reservation.booking_contact ?? "")}
      canCancel={reservation.can_cancel === true}
    />
  );
}
