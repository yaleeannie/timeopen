"use client";

import { colors } from "@/lib/design/colors";

type Props = {
  times: string[];
  value: string | null;
  disabled?: boolean;
  requiredMin?: number; // duration+buffer
  onChange: (time: string) => void;
  recommendedTime?: string | null;
};

function fmtRequired(requiredMin?: number) {
  if (!requiredMin || requiredMin <= 0) return "";
  const h = Math.floor(requiredMin / 60);
  const m = requiredMin % 60;
  if (h <= 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

export default function TimePicker({
  times,
  value,
  disabled,
  requiredMin,
  onChange,
  recommendedTime, // ✅ 이게 빠져 있었음
}: Props) {
  // 1) 서비스/날짜를 안 골랐으면 안내
  if (disabled) {
    return (
      <div
        className="rounded-xl border px-4 py-8 text-center text-sm"
        style={{
          borderColor: colors.border.default,
          color: colors.text.muted,
          background: colors.background.subtle,
        }}
      >
        서비스와 날짜를 먼저 선택해줘
      </div>
    );
  }

  // 2) 가능한 시간이 없으면 EmptyState
  if (times.length === 0) {
    return (
      <div
        className="rounded-2xl border px-4 py-6"
        style={{
          borderColor: colors.border.default,
          background: colors.background.base,
        }}
      >
        <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>
          가능한 시간이 없어요
        </div>
        <div className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
          {requiredMin
            ? `연속 ${fmtRequired(requiredMin)} 필요해요 (서비스 시간 + 버퍼).`
            : "연속 시간이 필요해요."}
        </div>
        <div className="mt-3 text-sm" style={{ color: colors.text.muted }}>
          다른 날짜를 선택해줘.
        </div>
      </div>
    );
  }

  // 3) 가능한 시간 버튼들
  return (
    <div className="flex flex-wrap gap-2">
      {times.map((t) => {
        const active = value === t;
        const isRecommended = recommendedTime != null && t === recommendedTime;

        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className="rounded-xl border px-4 py-2 text-sm transition"
            style={{
              borderColor: active ? colors.border.active : colors.border.default,
              background: active ? colors.brand.primary : colors.background.base,
              color: active ? colors.text.inverse : colors.text.primary,
            }}
          >
            <span>{t}</span>

            {/* ✅ 추천 배지 */}
            {isRecommended && (
              <span
                className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  border: `1px solid ${colors.border.default}`,
                  background: colors.background.base,
                  color: colors.text.secondary,
                }}
              >
                추천
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}