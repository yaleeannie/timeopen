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

function StatItem({
  label,
  value,
  sub,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-44 min-w-0 flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4 text-xs font-extrabold tracking-wide text-gray-500">{label}</div>

      <div className="break-words text-2xl font-black leading-tight tracking-tight text-gray-950 [overflow-wrap:anywhere]">
        {value}
      </div>

      {sub ? (
        <div className="mt-2 text-sm leading-5 text-gray-400 [overflow-wrap:anywhere]">
          {sub}
        </div>
      ) : null}

      {children ? <div className="mt-auto pt-4">{children}</div> : null}
    </div>
  );
}

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <StatItem
        label="오늘 예약"
        value={`${String(todayReservationCount ?? 0)}건`}
        sub={`${todayISO} 기준 확정 예약`}
      />

      <StatItem
        label="다음 예약"
        value={nextReservationTime || "예정 없음"}
        sub={nextReservationTime ? nextReservationCustomer || "고객명 미입력" : "오늘 남은 확정 예약"}
      />

      <StatItem
        label="예약 링크"
        value={previewPath}
        sub={canLink ? previewFullLink : "handle 설정 필요"}
      >
        {canLink ? (
          <div className="flex min-h-8 items-center gap-2">
            <button
              type="button"
              onClick={copyBookingLink}
              className="min-h-11 shrink-0 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
            >
              링크 복사
            </button>
            <span className="text-xs font-semibold text-gray-500" aria-live="polite">
              {copyStatus}
            </span>
          </div>
        ) : null}
      </StatItem>

      <StatItem
        label="문자 크레딧"
        value="준비 중"
        sub="문자 발송 잔액 기능을 준비하고 있습니다."
      />
    </div>
  );
}
