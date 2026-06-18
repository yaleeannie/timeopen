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
    <div className="min-h-36 bg-white p-4 md:min-h-40 md:p-5">
      <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 8 }}>
        {label}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 900,
          color: "#111827",
          wordBreak: "break-word",
          lineHeight: 1.3,
        }}
      >
        {value}
      </div>

      {sub ? (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#9ca3af",
            lineHeight: 1.4,
            overflowWrap: "anywhere",
          }}
        >
          {sub}
        </div>
      ) : null}

      {children}
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
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        background: "#fff",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        className="grid grid-cols-2 gap-px bg-gray-200 md:grid-cols-4"
      >
        <StatItem
          label="오늘 예약"
          value={String(todayReservationCount ?? 0)}
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
            <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={copyBookingLink}
                className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                링크 복사
              </button>
              <span className="text-xs font-medium text-gray-500" aria-live="polite">
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
    </div>
  );
}
