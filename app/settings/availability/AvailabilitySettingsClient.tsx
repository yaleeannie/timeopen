"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAvailabilityFromDb } from "@/features/availability/fetchAvailabilityFromDb";
import { weeklyScheduleToFormState } from "@/features/availability/weeklyScheduleToFormState";
import { WEEKDAYS, type AvailabilityFormState, type WeekdayKey } from "@/features/availability/types";

/* ------------------ 기본 상태 ------------------ */
function defaultState(): AvailabilityFormState {
  return {
    mon: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    tue: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    wed: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    thu: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    fri: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    sat: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
    sun: { open: false, work_start: "09:00", work_end: "18:00", break_start: "", break_end: "" },
  };
}

/* ------------------ validation ------------------ */
function timeToMinutes(t: string): number {
  const [hh, mm] = t.split(":").map((x) => Number(x));
  return hh * 60 + mm;
}

function validateDay(day: AvailabilityFormState[WeekdayKey], label: string): string | null {
  if (!day.open) return null;

  const ws = timeToMinutes(day.work_start);
  const we = timeToMinutes(day.work_end);
  if (!(ws < we)) return `${label}요일: 시작 시간은 종료 시간보다 빨라야 합니다.`;

  const hasBreak = !!day.break_start || !!day.break_end;
  if (!hasBreak) return null;
  if (!day.break_start || !day.break_end) {
    return `${label}요일: 쉬는 시간의 시작과 종료를 모두 입력해주세요.`;
  }

  const bs = timeToMinutes(day.break_start);
  const be = timeToMinutes(day.break_end);
  if (!(bs < be)) return `${label}요일: 쉬는 시간 시작은 종료보다 빨라야 합니다.`;
  if (bs < ws || be > we) {
    return `${label}요일: 쉬는 시간은 영업시간 안으로 설정해주세요.`;
  }

  return null;
}

function TimeField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="time"
      value={value}
      step={600}
      onChange={(event) => onChange(event.target.value)}
      className="min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base font-semibold text-gray-900 outline-none transition focus:border-[#55d4f0] focus:ring-2 focus:ring-cyan-100"
    />
  );
}

/* ------------------ form state -> api rows ------------------ */
function toApiRows(state: AvailabilityFormState) {
  const map: Record<WeekdayKey, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };

  return WEEKDAYS.map(({ key }) => {
    const d = state[key];

    return {
      weekday: map[key],
      is_open: d.open,
      work_start: d.open ? d.work_start : null,
      work_end: d.open ? d.work_end : null,
      break_start: d.open && d.break_start ? d.break_start : null,
      break_end: d.open && d.break_end ? d.break_end : null,
    };
  });
}

/* ------------------ main ------------------ */
export default function AvailabilitySettingsClient({ organizationId }: { organizationId: string }) {
  const [state, setState] = useState<AvailabilityFormState>(defaultState());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const weekly = await fetchAvailabilityFromDb({ organizationId });
        const form = weeklyScheduleToFormState(weekly);
        if (alive) setState(form);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [organizationId]);

  const firstError = useMemo(() => {
    for (const { key, label } of WEEKDAYS) {
      const e = validateDay(state[key], label);
      if (e) return e;
    }
    return null;
  }, [state]);

  function patch(key: WeekdayKey, patchObj: Partial<AvailabilityFormState[WeekdayKey]>) {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...patchObj } }));
  }

  async function onSave() {
    setMsg(null);

    if (firstError) {
      setMsg(firstError);
      return;
    }

    setSaving(true);
    try {
      const rows = toApiRows(state);

      const res = await fetch("/api/settings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? `저장 실패 (HTTP ${res.status})`);
        return;
      }

      setMsg("저장되었습니다.");
    } catch (e) {
      console.error(e);
      setMsg("네트워크 오류입니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-2.5">
        {WEEKDAYS.map(({ key, label }) => {
          const d = state[key];
          const dayError = validateDay(d, label);

          return (
            <div
              key={key}
              className={`min-w-0 rounded-[20px] border bg-white p-4 shadow-sm ${
                dayError ? "border-red-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-black text-gray-900">{label}요일</div>
                  <div className={`mt-0.5 text-xs font-bold ${d.open ? "text-[#22a988]" : "text-gray-400"}`}>
                    {d.open ? "예약 가능한 날" : "쉬는 날"}
                  </div>
                </div>

                <label className="flex min-h-10 items-center gap-2 rounded-xl bg-[#f4fafb] px-3 text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={d.open}
                    onChange={(e) => {
                      const open = e.target.checked;
                      patch(key, { open, ...(open ? {} : { break_start: "", break_end: "" }) });
                    }}
                    className="h-5 w-5 accent-[#28b9dc]"
                  />
                  <span className="font-black">영업함</span>
                </label>
              </div>

              {d.open ? (
                <div className="mt-4 grid gap-4 border-t border-[#edf4f5] pt-4">
                  <div>
                    <div className="mb-2 text-sm font-black text-gray-700">영업시간</div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-500">시작 시간</div>
                        <TimeField
                          value={d.work_start}
                          onChange={(v) => patch(key, { work_start: v })}
                        />
                      </div>
                      <span className="pb-3 text-sm font-black text-gray-400">~</span>
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-500">종료 시간</div>
                        <TimeField
                          value={d.work_end}
                          onChange={(v) => patch(key, { work_end: v })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-black text-gray-700">
                      쉬는 시간 <span className="font-medium text-gray-400">(선택)</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-500">시작 시간</div>
                        <TimeField
                          value={d.break_start}
                          onChange={(v) => patch(key, { break_start: v })}
                        />
                      </div>
                      <span className="pb-3 text-sm font-black text-gray-400">~</span>
                      <div className="space-y-2">
                        <div className="text-xs font-bold text-gray-500">종료 시간</div>
                        <TimeField
                          value={d.break_end}
                          onChange={(v) => patch(key, { break_end: v })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {dayError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {dayError}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            msg === "저장되었습니다."
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {msg}
        </div>
      )}

      <div>
        <button
          onClick={onSave}
          disabled={saving}
          className="min-h-11 w-full rounded-xl bg-[#28b9dc] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#20afd2] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "저장 중..." : "영업시간 저장"}
        </button>
      </div>
    </div>
  );
}
