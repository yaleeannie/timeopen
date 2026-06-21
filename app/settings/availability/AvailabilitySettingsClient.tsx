"use client";

import { useEffect, useState } from "react";
import TimeSelect from "@/components/TimeSelect";
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

function TimeRangeFields({
  title,
  optional,
  start,
  end,
  onStartChange,
  onEndChange,
}: {
  title: string;
  optional?: boolean;
  start: string;
  end: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#e5f1f3] bg-[#f9fcfd] p-3.5">
      <div className="mb-3 flex items-baseline gap-1.5">
        <div className="text-sm font-black text-gray-800">{title}</div>
        {optional ? <span className="text-xs font-medium text-gray-400">선택</span> : null}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-bold text-gray-500">시작 시간</span>
          <TimeSelect
            value={start}
            onChange={onStartChange}
            placeholder="시작 시간"
            allowEmpty={optional}
            aria-label={`${title} 시작 시간`}
          />
        </label>
        <span className="mt-5 text-sm font-black text-gray-300">~</span>
        <label className="min-w-0">
          <span className="mb-1.5 block text-xs font-bold text-gray-500">종료 시간</span>
          <TimeSelect
            value={end}
            onChange={onEndChange}
            placeholder="종료 시간"
            allowEmpty={optional}
            aria-label={`${title} 종료 시간`}
          />
        </label>
      </div>
    </div>
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
  const [quickWeekdays, setQuickWeekdays] = useState<WeekdayKey[]>([
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
  ]);
  const [quickStart, setQuickStart] = useState("09:00");
  const [quickEnd, setQuickEnd] = useState("18:00");
  const [quickBreakStart, setQuickBreakStart] = useState("");
  const [quickBreakEnd, setQuickBreakEnd] = useState("");
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

  function patch(key: WeekdayKey, patchObj: Partial<AvailabilityFormState[WeekdayKey]>) {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], ...patchObj } }));
  }

  function getFirstError(nextState: AvailabilityFormState) {
    for (const { key, label } of WEEKDAYS) {
      const error = validateDay(nextState[key], label);
      if (error) return error;
    }
    return null;
  }

  async function saveState(nextState: AvailabilityFormState, successMessage: string) {
    setMsg(null);

    const validationError = getFirstError(nextState);
    if (validationError) {
      setMsg(validationError);
      return;
    }

    setSaving(true);
    try {
      const rows = toApiRows(nextState);

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

      setState(nextState);
      setMsg(successMessage);
    } catch (e) {
      console.error(e);
      setMsg("네트워크 오류입니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function onSave() {
    await saveState(state, "영업시간이 저장되었습니다.");
  }

  async function applyQuickSettings() {
    if (quickWeekdays.length === 0) {
      setMsg("일괄 적용할 요일을 한 개 이상 선택해주세요.");
      return;
    }

    if (!quickStart || !quickEnd || quickStart >= quickEnd) {
      setMsg("영업시간의 시작·종료 시간을 확인해주세요.");
      return;
    }

    const hasBreak = Boolean(quickBreakStart || quickBreakEnd);
    if (
      hasBreak &&
      (!quickBreakStart ||
        !quickBreakEnd ||
        quickBreakStart >= quickBreakEnd ||
        quickBreakStart < quickStart ||
        quickBreakEnd > quickEnd)
    ) {
      setMsg("쉬는 시간을 영업시간 안으로 설정해주세요.");
      return;
    }

    const nextState: AvailabilityFormState = { ...state };
    for (const key of quickWeekdays) {
      nextState[key] = {
        open: true,
        work_start: quickStart,
        work_end: quickEnd,
        break_start: hasBreak ? quickBreakStart : "",
        break_end: hasBreak ? quickBreakEnd : "",
      };
    }

    await saveState(nextState, "선택한 요일에 영업시간을 적용했습니다.");
  }

  function toggleQuickWeekday(key: WeekdayKey) {
    setQuickWeekdays((current) =>
      current.includes(key)
        ? current.filter((weekday) => weekday !== key)
        : [...current, key]
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <section className="overflow-hidden rounded-[26px] border border-[#cdebf0] bg-white shadow-[0_14px_34px_rgba(70,126,139,0.08)]">
        <div className="bg-gradient-to-br from-[#eafafd] via-[#f4fcfd] to-white px-5 pb-5 pt-5">
          <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#168ca8] shadow-sm">
            한 번에 설정
          </div>
          <h2 className="mt-3 text-xl font-black tracking-[-0.03em] text-gray-950">
            빠르게 적용하기
          </h2>
          <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
            여러 요일에 같은 영업시간과 쉬는 시간을 한 번에 적용할 수 있어요.
          </p>
        </div>

        <div className="grid gap-5 px-4 pb-5 pt-4 sm:px-5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff7fb] text-xs font-black text-[#168ca8]">
                1
              </span>
              <div className="text-sm font-black text-gray-800">운영 요일 선택</div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map(({ key, label }) => {
                const selected = quickWeekdays.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleQuickWeekday(key)}
                    className={`min-h-9 min-w-9 rounded-full border px-2.5 text-sm font-black transition ${
                      selected
                        ? "border-[#31bfdc] bg-[#31bfdc] text-white"
                        : "border-[#dcecef] bg-white text-gray-500 hover:border-[#9bdde7]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff7fb] text-xs font-black text-[#168ca8]">
                2
              </span>
              <div className="text-sm font-black text-gray-800">영업시간</div>
            </div>
            <TimeRangeFields
              title="고객이 예약할 수 있는 시간"
              start={quickStart}
              end={quickEnd}
              onStartChange={setQuickStart}
              onEndChange={setQuickEnd}
            />
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dff7fb] text-xs font-black text-[#168ca8]">
                3
              </span>
              <div className="text-sm font-black text-gray-800">쉬는 시간</div>
            </div>
            <TimeRangeFields
              title="예약을 받지 않는 시간"
              optional
              start={quickBreakStart}
              end={quickBreakEnd}
              onStartChange={setQuickBreakStart}
              onEndChange={setQuickBreakEnd}
            />
          </div>

          <button
            type="button"
            onClick={applyQuickSettings}
            disabled={saving}
            className="min-h-13 w-full rounded-2xl bg-gradient-to-r from-[#37c5df] to-[#20afd2] px-4 py-3.5 text-sm font-black text-white shadow-[0_12px_24px_rgba(32,175,210,0.2)] disabled:opacity-50"
          >
            {saving ? "적용 중..." : "선택한 요일에 일괄 적용"}
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 px-1">
          <h2 className="text-lg font-black tracking-[-0.025em] text-gray-950">
            요일별 영업시간
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 text-gray-500">
            필요한 요일만 따로 수정할 수 있어요.
          </p>
        </div>

        <div className="space-y-2.5">
          {WEEKDAYS.map(({ key, label }) => {
            const d = state[key];
            const dayError = validateDay(d, label);

            return (
              <article
                key={key}
                className={`min-w-0 overflow-hidden rounded-[22px] border bg-white shadow-sm ${
                  dayError ? "border-red-200" : "border-gray-200"
                }`}
              >
              <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <div>
                  <div className="text-lg font-black text-gray-900">{label}요일</div>
                  <div className={`mt-0.5 text-xs font-bold ${d.open ? "text-[#159b83]" : "text-gray-400"}`}>
                    {d.open
                      ? `${d.work_start} ~ ${d.work_end}${d.break_start && d.break_end ? ` · 휴식 ${d.break_start} ~ ${d.break_end}` : ""}`
                      : "쉬는 날"}
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={d.open}
                  onClick={() => {
                    const open = !d.open;
                    patch(key, { open, ...(open ? {} : { break_start: "", break_end: "" }) });
                  }}
                  className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-black transition ${
                    d.open
                      ? "border-[#9de3d4] bg-[#e9faf6] text-[#16866f]"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      d.open ? "bg-[#24b795]" : "bg-gray-300"
                    }`}
                  />
                  {d.open ? "영업함" : "쉬는 날"}
                </button>
              </div>

              {d.open ? (
                <div className="grid gap-3 border-t border-[#edf4f5] bg-[#fbfdfd] p-3">
                  <TimeRangeFields
                    title="영업시간"
                    start={d.work_start}
                    end={d.work_end}
                    onStartChange={(value) => patch(key, { work_start: value })}
                    onEndChange={(value) => patch(key, { work_end: value })}
                  />
                  <TimeRangeFields
                    title="쉬는 시간"
                    optional
                    start={d.break_start}
                    end={d.break_end}
                    onStartChange={(value) => patch(key, { break_start: value })}
                    onEndChange={(value) => patch(key, { break_end: value })}
                  />
                </div>
              ) : null}

              {dayError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {dayError}
                </div>
              )}
              </article>
            );
          })}
        </div>
      </section>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            msg.includes("저장") || msg.includes("적용")
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
