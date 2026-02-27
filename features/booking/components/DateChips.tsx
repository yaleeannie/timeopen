"use client";

import { useMemo } from "react";
import { colors } from "@/lib/design/colors";

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

const DOW = ["일", "월", "화", "수", "목", "금", "토"] as const;

export default function DateChips({ value, onChange, days = 14 }: Props) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const items = useMemo(() => {
    return Array.from({ length: days }, (_, i) => {
      const d = addDays(today, i);
      return {
        iso: toISO(d),
        dow: DOW[d.getDay()],
        dd: d.getDate(),
        mm: d.getMonth() + 1,
      };
    });
  }, [today, days]);

  // ✅ value가 null이면 "선택 없음"
  const selectedISO = value;

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
        날짜 선택
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
            {selectedISO ?? "날짜를 선택해줘"}
          </div>
          <div className="text-xs" style={{ color: colors.text.muted }}>
            최근 {days}일
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
                    borderColor: active ? colors.border.active : colors.border.default,
                    background: active ? colors.brand.primary : colors.background.base,
                    color: active ? colors.text.inverse : colors.text.primary,
                  }}
                >
                  <div
                    className="text-xs font-semibold"
                    style={{ color: active ? "rgba(255,255,255,0.85)" : colors.text.secondary }}
                  >
                    {it.dow}
                  </div>

                  <div className="text-lg font-semibold leading-tight">{it.dd}</div>

                  <div
                    className="text-[11px]"
                    style={{ color: active ? "rgba(255,255,255,0.75)" : colors.text.muted }}
                  >
                    {it.mm}월
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