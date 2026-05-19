"use client";

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
  copyValue,
}: {
  label: string;
  value: string;
  sub?: string;
  copyValue?: string;
}) {
  const isCopyable = !!copyValue;

  return (
    <button
      type="button"
      onClick={async () => {
        if (!copyValue) return;
        try {
          await navigator.clipboard.writeText(copyValue);
          alert("예약 링크가 복사되었습니다.");
        } catch {
          alert("링크 복사에 실패했습니다.");
        }
      }}
      style={{
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        padding: 16,
        cursor: isCopyable ? "pointer" : "default",
      }}
    >
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
        <div style={{ marginTop: 6, fontSize: 12, color: "#9ca3af", lineHeight: 1.4 }}>
          {sub}
        </div>
      ) : null}
    </button>
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
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <div style={{ borderRight: "1px solid #e5e7eb", borderBottom: "1px solid #e5e7eb" }}>
          <StatItem
            label="서비스명"
            value={nameText || "-"}
            sub="고객에게 표시되는 대표 이름"
          />
        </div>

        <div style={{ borderBottom: "1px solid #e5e7eb" }}>
          <StatItem
            label="오늘 예약"
            value={String(todayReservationCount ?? 0)}
            sub={`${todayISO} 기준 확정 예약`}
          />
        </div>

        <div style={{ borderRight: "1px solid #e5e7eb" }}>
          <StatItem
            label="활성 서비스"
            value={String(serviceCount ?? 0)}
            sub="현재 예약 가능한 서비스 수"
          />
        </div>

        <div>
          <StatItem
            label="예약 링크"
            value={previewPath}
            sub={canLink ? "눌러서 링크 복사" : "handle 설정 필요"}
            copyValue={canLink ? previewFullLink : undefined}
          />
        </div>
      </div>
    </div>
  );
}