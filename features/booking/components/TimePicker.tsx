"use client";

import { colors } from "@/lib/design/colors";
import { usePublicBookingI18n } from "./PublicBookingI18n";

type Props = {
  times: string[];
  value: string | null;
  disabled?: boolean;
  requiredMin?: number; // duration+buffer
  onChange: (time: string) => void;
  recommendedTime?: string | null;
};

function fmtRequired(
  requiredMin: number | undefined,
  t: ReturnType<typeof usePublicBookingI18n>["t"]
) {
  if (!requiredMin || requiredMin <= 0) return "";
  const h = Math.floor(requiredMin / 60);
  const m = requiredMin % 60;
  if (h <= 0) return t("minutes", { count: m });
  if (m === 0) return t("hours", { count: h });
  return t("hoursMinutes", { hours: h, minutes: m });
}

export default function TimePicker({
  times,
  value,
  disabled,
  requiredMin,
  onChange,
  recommendedTime,
}: Props) {
  const { t } = usePublicBookingI18n();
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
        {t("selectServiceAndDate")}
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
          {t("noTimes")}
        </div>
        <div className="mt-1 text-sm" style={{ color: colors.text.secondary }}>
          {requiredMin
            ? t("continuousMinutesRequired", { duration: fmtRequired(requiredMin, t) })
            : t("continuousTimeRequired")}
        </div>
        <div className="mt-3 text-sm" style={{ color: colors.text.muted }}>
          {t("chooseAnotherDate")}
        </div>
      </div>
    );
  }

  // 3) 가능한 시간 버튼들
  return (
    <div className="grid w-full max-w-md grid-cols-3 gap-3 sm:grid-cols-4">
      {times.map((time) => {
        const active = value === time;
        const isRecommended = recommendedTime != null && time === recommendedTime;

        return (
          <button
            key={time}
            type="button"
            onClick={() => onChange(time)}
            className="min-h-10 w-full rounded-xl border px-3 py-2 text-sm transition"
            style={{
              borderColor: active ? "var(--brand-primary)" : colors.border.default,
              background: active
                ? "linear-gradient(135deg, var(--brand-accent), var(--brand-primary))"
                : colors.background.base,
              color: active ? "var(--brand-contrast)" : colors.text.primary,
            }}
          >
            <span>{time}</span>

            {isRecommended && (
              <span
                className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold sm:ml-2 sm:mt-0"
                style={{
                  border: `1px solid ${colors.border.default}`,
                  background: colors.background.base,
                  color: colors.text.secondary,
                }}
              >
                {t("earliestTime")}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
