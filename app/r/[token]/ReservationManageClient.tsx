"use client";

import { useState } from "react";

type Props = {
  token: string;
  shopName: string;
  serviceName: string;
  dateText: string;
  timeText: string;
  status: string;
  bookingContact: string;
  canCancel: boolean;
};

function statusLabel(status: string) {
  if (status === "requested") return "예약 요청";
  if (status === "confirmed") return "예약 확정";
  if (status === "cancelled" || status === "canceled") return "예약 취소";
  return status || "예약";
}

export default function ReservationManageClient({
  token,
  shopName,
  serviceName,
  dateText,
  timeText,
  status,
  bookingContact,
  canCancel,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentStatus, setCurrentStatus] = useState(status);

  const cancelled = currentStatus === "cancelled" || currentStatus === "canceled";
  const canShowCancel = canCancel && !cancelled;

  async function cancelReservation() {
    if (loading) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/reservations/public-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok || json?.ok === false) {
        setMessage(json?.error ?? "예약을 취소하지 못했어요.");
        return;
      }

      setCurrentStatus("cancelled");
      setConfirming(false);
      setMessage(json?.message ?? "예약이 취소되었어요.");
    } catch {
      setMessage("예약을 취소하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="soft-page-bg min-h-screen overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8">
          <header className="mb-5 text-center">
            <div className="brand-text text-sm font-black">예약 확인/취소</div>
            <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
              {shopName || "예약"} 예약 정보
            </h1>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              예약 변경이 필요하면 샵에 문의해주세요.
            </p>
          </header>

          <section className="brand-gradient rounded-[24px] p-5 text-white shadow-[0_14px_30px_rgba(0,193,255,0.22)]">
            <div className="text-sm font-bold text-white/80">상태</div>
            <div className="mt-1 text-xl font-black">{statusLabel(currentStatus)}</div>
            <div className="my-4 h-px bg-white/20" />
            <div className="grid gap-3 text-sm font-bold">
              <div>
                <div className="text-white/75">서비스</div>
                <div className="mt-1 text-lg font-black">{serviceName || "예약"}</div>
              </div>
              <div>
                <div className="text-white/75">일시</div>
                <div className="mt-1 text-lg font-black">
                  {dateText} {timeText}
                </div>
              </div>
            </div>
          </section>

          {bookingContact ? (
            <section className="glass-card mt-4 rounded-[24px] p-4">
              <div className="brand-text text-sm font-bold">예약 문의</div>
              <div className="mt-1 whitespace-pre-wrap text-sm font-black leading-6 text-slate-800 [overflow-wrap:anywhere]">
                {bookingContact}
              </div>
            </section>
          ) : null}

          <section className="glass-card mt-4 rounded-[24px] p-4">
            <div className="text-base font-black text-slate-950">예약 취소</div>
            {cancelled ? (
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                이미 취소된 예약이에요.
              </p>
            ) : canShowCancel ? (
              <>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                  예약 시간 3일 전까지 이 링크에서 직접 취소할 수 있어요.
                </p>
                {confirming ? (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
                    <div className="text-sm font-black text-rose-800">
                      예약을 취소하시겠어요?
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={cancelReservation}
                        className="min-h-11 flex-1 rounded-xl bg-rose-600 px-4 text-sm font-black text-white disabled:opacity-60"
                      >
                        {loading ? "취소 중..." : "예약 취소"}
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => setConfirming(false)}
                        className="brand-outline min-h-11 flex-1 rounded-xl px-4 text-sm font-black disabled:opacity-60"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="mt-4 min-h-12 w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 text-sm font-black text-rose-700"
                  >
                    예약 취소
                  </button>
                )}
              </>
            ) : (
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                예약 시간이 가까워 직접 취소가 어려워요. 취소가 필요하면 샵에
                문의해주세요.
              </p>
            )}

            {message ? (
              <div className="mt-4 rounded-xl border border-white/70 bg-white/70 px-4 py-3 text-sm font-bold leading-5 text-slate-700 [overflow-wrap:anywhere]">
                {message}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
