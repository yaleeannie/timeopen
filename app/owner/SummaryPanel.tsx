"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  todayReservationCount: number;
  nextReservationTime: string;
  nextReservationCustomer: string;
  previewPath: string;
  previewFullLink: string;
  canLink: boolean;
  todayISO: string;
};

export default function SummaryPanel({
  todayReservationCount,
  nextReservationTime,
  nextReservationCustomer,
  previewPath,
  previewFullLink,
  canLink,
  todayISO,
}: Props) {
  const [copyStatus, setCopyStatus] = useState("");
  const copyStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyStatusTimerRef.current) {
        clearTimeout(copyStatusTimerRef.current);
      }
    };
  }, []);

  function showCopyStatus(status: string) {
    setCopyStatus(status);

    if (copyStatusTimerRef.current) {
      clearTimeout(copyStatusTimerRef.current);
    }

    copyStatusTimerRef.current = setTimeout(() => {
      setCopyStatus("");
      copyStatusTimerRef.current = null;
    }, 2000);
  }

  async function copyBookingLink() {
    if (!canLink || !previewFullLink) return;

    try {
      await navigator.clipboard.writeText(previewFullLink);
      showCopyStatus("복사됨");
    } catch {
      showCopyStatus("복사 실패");
    }
  }

  return (
    <div className="min-w-0">
      <div className="min-w-0 rounded-[24px] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] p-5 text-white shadow-[0_14px_30px_rgba(40,185,220,0.25)] sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-cyan-50">오늘 예약</div>
            <div className="mt-1 text-4xl font-black tracking-tight">
              {String(todayReservationCount ?? 0)}
              <span className="ml-1 text-lg">건</span>
            </div>
          </div>
          <div className="min-w-0 text-right">
            <div className="text-sm font-bold text-cyan-50">다음 예약</div>
            <div className="mt-1 text-2xl font-black">
              {nextReservationTime || "없음"}
            </div>
            <div className="mt-1 max-w-32 truncate text-sm text-cyan-50">
              {nextReservationTime ? nextReservationCustomer || "고객명 미입력" : "남은 예약 없음"}
            </div>
          </div>
        </div>

        <div className="my-5 h-px bg-white/20" />

        <div className="min-w-0">
          <div className="text-sm font-bold text-cyan-50">예약 링크</div>
          <div className="mt-1 break-words text-base font-extrabold [overflow-wrap:anywhere]">
            {previewPath}
          </div>
          <div className="mt-1 break-words text-sm leading-5 text-cyan-50 [overflow-wrap:anywhere]">
            {canLink ? previewFullLink : "handle 설정 필요"}
          </div>

          {canLink ? (
            <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={copyBookingLink}
                className="min-h-11 shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-[#19a9cd] shadow-sm transition hover:bg-cyan-50"
              >
                링크 복사
              </button>
              <span className="text-sm font-bold text-cyan-50" aria-live="polite">
                {copyStatus}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-[#e5f3f6] bg-white px-4 py-3 shadow-sm">
        <div>
          <div className="text-sm font-extrabold text-gray-800">문자 크레딧</div>
          <div className="mt-0.5 text-sm text-gray-400">{todayISO} 기준</div>
        </div>
        <span className="shrink-0 rounded-full bg-[#eef9fb] px-3 py-1.5 text-sm font-extrabold text-[#4d9caf]">
          준비 중
        </span>
      </div>
    </div>
  );
}
