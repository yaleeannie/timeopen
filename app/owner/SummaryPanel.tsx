"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  nameText: string;
  todayReservationCount: number;
  serviceCount: number;
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
  nameText,
  todayReservationCount,
  serviceCount,
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
          label="서비스명"
          value={nameText || "-"}
          sub="고객에게 표시되는 대표 이름"
        />

        <StatItem
          label="오늘 예약"
          value={String(todayReservationCount ?? 0)}
          sub={`${todayISO} 기준 확정 예약`}
        />

        <StatItem
          label="활성 서비스"
          value={String(serviceCount ?? 0)}
          sub="현재 예약 가능한 서비스 수"
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
      </div>
    </div>
  );
}
