"use client";

import { useMemo } from "react";
import { colors } from "@/lib/design/colors";
import { usePublicBookingI18n } from "./PublicBookingI18n";

type Props = {
  value: string | null; // YYYY-MM-DD
  onChange: (dateISO: string) => void;
  days?: number; // 기본 14일
};

function toISO(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default function DateChips({ value, onChange, days = 14 }: Props) {
  const { locale, t } = usePublicBookingI18n();
  const today = useMemo(() => startOfDay(new Date()), []);
  const items = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = addDays(today, i);
      return {
        iso: toISO(d),
        dow: new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d),
        dd: d.getDate(),
        month: new Intl.DateTimeFormat(locale, { month: "short" }).format(d),
      };
    });
  }, [today, days, locale]);

  // ✅ value가 null이면 "선택 없음"
  const selectedISO = value;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
        {t("selectDate")}
      </div>

      <div
        className="rounded-2xl border p-3"
        style={{
          borderColor: colors.border.default,
          background: colors.background.base,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            {selectedISO ?? t("selectDatePrompt")}
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            {t("nextDays", { days })}
          </div>
        </div>

        <div className="mt-3 -mx-3 px-3 overflow-x-auto">
          <div className="flex gap-2">
            {items.map((it) => {
              const active = selectedISO != null && it.iso === selectedISO;

              return (
                <button
                  key={it.iso}
                  type="button"
                  onClick={() => onChange(it.iso)}
                  className="shrink-0 rounded-2xl border px-3 py-2 text-center transition"
                  style={{
                    minWidth: 68,
                    borderColor: active ? "var(--brand-primary)" : colors.border.default,
                    background: active
                      ? "linear-gradient(135deg, var(--brand-accent), var(--brand-primary))"
                      : colors.background.base,
                    color: active ? "var(--brand-contrast)" : colors.text.primary,
                  }}
                >
                  <div
                    className="text-xs font-semibold"
                    style={{ color: active ? "var(--brand-contrast)" : colors.text.secondary }}
                  >
                    {it.dow}
                  </div>

                  <div className="text-lg font-semibold leading-tight">{it.dd}</div>

                  <div
                    className="text-[11px]"
                    style={{ color: active ? "var(--brand-contrast)" : colors.text.muted }}
                  >
                    {it.month}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
