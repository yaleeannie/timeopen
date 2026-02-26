"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveAvailability } from "./actions";
import { fetchAvailabilityFromDb } from "../../../features/availability/fetchAvailabilityFromDb";
import { weeklyScheduleToFormState } from "../../../features/availability/weeklyScheduleToFormState";
import { WEEKDAYS, type AvailabilityFormState, type WeekdayKey } from "../../../features/availability/types";

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
  if (!(ws < we)) return `${label}: work_start < work_end 여야 합니다.`;

  const hasBreak = !!day.break_start || !!day.break_end;
  if (!hasBreak) return null;
  if (!day.break_start || !day.break_end) return `${label}: break_start/break_end 를 모두 입력하세요.`;

  const bs = timeToMinutes(day.break_start);
  const be = timeToMinutes(day.break_end);
  if (!(bs < be)) return `${label}: break_start < break_end 여야 합니다.`;
  if (bs < ws || be > we) return `${label}: break 는 work 범위 안에서만 허용됩니다.`;

  return null;
}

/* ------------------ time list (10분 단위) ------------------ */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function buildTimes(stepMinutes: number) {
  const out: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    out.push(`${pad2(hh)}:${pad2(mm)}`);
  }
  return out;
}

const TIMES_10 = buildTimes(10);

/* ------------------ click outside ------------------ */

function useOnClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      handler();
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [handler]);
  return ref;
}

/* ------------------ icons ------------------ */

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/* ------------------ TimePicker (커스텀) ------------------ */

function TimePicker({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useOnClickOutside<HTMLDivElement>(() => setOpen(false));

  const selectedIndex = useMemo(() => {
    if (!value) return 0;
    const idx = TIMES_10.indexOf(value);
    return idx >= 0 ? idx : 0;
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const el = rootRef.current?.querySelector<HTMLDivElement>("[data-time-list]");
    if (!el) return;
    const rowH = 36;
    el.scrollTop = Math.max(0, selectedIndex * rowH - rowH * 4);
  }, [open, selectedIndex, rootRef]);

  const btnCls =
    "flex w-full items-center justify-between gap-2 rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-left " +
    "text-gray-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-gray-200 " +
    "hover:border-gray-400 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div ref={rootRef} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((v) => !v)} className={btnCls}>
        <span className={`${value ? "text-gray-900" : "text-gray-500"} font-medium`}>{value || placeholder}</span>
        <ClockIcon className="h-5 w-5 text-gray-600" />
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <div className="text-xs font-semibold text-gray-800">Select time</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              Close
            </button>
          </div>

          <div data-time-list className="max-h-64 overflow-auto p-1" role="listbox" aria-label="time options">
            {TIMES_10.map((t) => {
              const active = t === value;
              return (
                <button
                  key={t}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(t);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                    active ? "bg-black text-white" : "text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <span className="font-semibold">{t}</span>
                  {active && <span className="text-xs font-medium opacity-90">Selected</span>}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="w-full rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-200"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
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

  // 🔥 저장 직전, 실제로 어떤 값이 서버로 가는지 확인
  console.log("SAVING ORG:", organizationId);
  console.log("SAVING STATE:", state);

  setSaving(true);
  try {
    await saveAvailability(organizationId, state);
    setMsg("저장되었습니다.");
  } catch (e: any) {
    setMsg(typeof e?.message === "string" ? e.message : "저장 실패");
  } finally {
    setSaving(false);
  }
}

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Availability Settings</h1>
        <p className="text-sm font-medium text-gray-700">요일별 영업시간과 브레이크 시간을 설정하세요.</p>

        <p className="text-xs text-red-500">
        DEBUG organizationId: {organizationId}
        </p>


        {/* ✅ 디버깅용: 지금 settings가 어떤 org에 저장하는지 보여줌 */}
        <p className="text-xs text-gray-500">organizationId: {organizationId}</p>
      </div>

      <div className="space-y-4">
        {WEEKDAYS.map(({ key, label }) => {
          const d = state[key];
          const dayError = validateDay(d, label);

          return (
            <div
              key={key}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${
                dayError ? "border-red-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <div className="text-lg font-semibold text-gray-900">{label}</div>
                  <span className={`text-xs font-bold ${d.open ? "text-green-700" : "text-gray-600"}`}>
                    {d.open ? "OPEN" : "CLOSED"}
                  </span>
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={d.open}
                    onChange={(e) => {
                      const open = e.target.checked;
                      patch(key, { open, ...(open ? {} : { break_start: "", break_end: "" }) });
                    }}
                    className="h-4 w-4 accent-black"
                  />
                  <span className="font-semibold">{d.open ? "open" : "closed"}</span>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-800">work_start</div>
                  <TimePicker
                    value={d.work_start}
                    disabled={!d.open}
                    onChange={(v) => patch(key, { work_start: v })}
                    placeholder="09:00"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-800">work_end</div>
                  <TimePicker
                    value={d.work_end}
                    disabled={!d.open}
                    onChange={(v) => patch(key, { work_end: v })}
                    placeholder="18:00"
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-800">break_start (optional)</div>
                  <TimePicker
                    value={d.break_start}
                    disabled={!d.open}
                    onChange={(v) => patch(key, { break_start: v })}
                    placeholder="13:00"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-gray-800">break_end (optional)</div>
                  <TimePicker
                    value={d.break_end}
                    disabled={!d.open}
                    onChange={(v) => patch(key, { break_end: v })}
                    placeholder="14:00"
                  />
                </div>
              </div>

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

      <div className="flex items-center justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-black px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}