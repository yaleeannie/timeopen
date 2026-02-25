"use client";

import type { BookingService } from "../types";
import { colors } from "@/lib/design/colors";

type Props = {
  services: BookingService[];
  value: string | null;
  onChange: (serviceId: string) => void;
};

export default function ServicePicker({ services, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>
        서비스 선택
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {services.map((s) => {
          const active = value === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s.id)}
              className="w-full rounded-xl border px-4 py-3 text-left transition"
              style={{
                borderColor: active ? colors.border.active : colors.border.default,
                background: active ? colors.brand.primary : colors.background.base,
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.borderColor = colors.border.active;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.borderColor = colors.border.default;
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className="font-semibold"
                    style={{ color: active ? colors.text.inverse : colors.text.primary }}
                  >
                    {s.name}
                  </div>

                  {s.description && (
                    <div
                      className="mt-1 text-sm"
                      style={{ color: active ? "rgba(255,255,255,0.85)" : colors.text.secondary }}
                    >
                      {s.description}
                    </div>
                  )}
                </div>

                <div
                  className="shrink-0 text-sm"
                  style={{ color: active ? "rgba(255,255,255,0.9)" : colors.text.muted }}
                >
                  {s.durationMin}m + {s.bufferMin}m
                </div>
              </div>

              {typeof s.price === "number" && (
                <div
                  className="mt-2 text-sm"
                  style={{ color: active ? "rgba(255,255,255,0.9)" : colors.text.primary }}
                >
                  {s.price.toLocaleString()}원
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}