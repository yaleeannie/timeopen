"use client";

import { useEffect, useState } from "react";

type Period = "" | "am" | "pm";

type TimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = ["00", "10", "20", "30", "40", "50"];

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { period: "" as Period, hour: "", minute: "" };

  const hour24 = Number(match[1]);
  const minute = match[2];
  if (hour24 > 23) return { period: "" as Period, hour: "", minute: "" };

  return {
    period: (hour24 < 12 ? "am" : "pm") as Period,
    hour: String(hour24 % 12 || 12),
    minute: MINUTES.includes(minute) ? minute : "",
  };
}

function toTimeValue(period: Period, hour: string, minute: string) {
  if (!period || !hour || !minute) return null;

  const hour12 = Number(hour);
  const hour24 =
    period === "am"
      ? hour12 === 12
        ? 0
        : hour12
      : hour12 === 12
        ? 12
        : hour12 + 12;

  return `${String(hour24).padStart(2, "0")}:${minute}`;
}

function SelectChevron() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#21aeca]"
    >
      <path
        d="m6 8 4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TimeSelect({
  value,
  onChange,
  placeholder = "시간 선택",
  allowEmpty = false,
  disabled = false,
  className = "",
  "aria-label": ariaLabel = "시간 선택",
}: TimeSelectProps) {
  const parsed = parseTime(value);
  const [period, setPeriod] = useState<Period>(parsed.period);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  useEffect(() => {
    const next = parseTime(value);
    setPeriod(next.period);
    setHour(next.hour);
    setMinute(next.minute);
  }, [value]);

  function update(nextPeriod: Period, nextHour: string, nextMinute: string) {
    setPeriod(nextPeriod);
    setHour(nextHour);
    setMinute(nextMinute);

    const nextValue = toTimeValue(nextPeriod, nextHour, nextMinute);
    if (nextValue) onChange(nextValue);
  }

  function changePeriod(nextPeriod: Period) {
    if (!nextPeriod) {
      setPeriod("");
      setHour("");
      setMinute("");
      onChange("");
      return;
    }

    update(nextPeriod, hour, minute);
  }

  const selectClass =
    "min-h-12 w-full appearance-none rounded-xl border border-[#dcecef] bg-white py-3 pl-2.5 pr-7 text-center text-sm font-black text-gray-900 outline-none transition focus:border-[#4fcbe6] focus:ring-3 focus:ring-cyan-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      title={!value ? placeholder : undefined}
      className={`grid min-w-0 grid-cols-[1.15fr_1fr_1fr] gap-1.5 ${className}`}
    >
      <div className="relative min-w-0">
        <select
          value={period}
          onChange={(event) => changePeriod(event.target.value as Period)}
          disabled={disabled}
          aria-label={`${ariaLabel} 오전 오후`}
          className={selectClass}
        >
          <option value="" disabled={!allowEmpty}>
            {allowEmpty ? "없음" : "구분"}
          </option>
          <option value="am">오전</option>
          <option value="pm">오후</option>
        </select>
        <SelectChevron />
      </div>

      <div className="relative min-w-0">
        <select
          value={hour}
          onChange={(event) => update(period, event.target.value, minute)}
          disabled={disabled}
          aria-label={`${ariaLabel} 시`}
          className={selectClass}
        >
          <option value="" disabled>
            시
          </option>
          {HOURS.map((option) => (
            <option key={option} value={option}>
              {option}시
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>

      <div className="relative min-w-0">
        <select
          value={minute}
          onChange={(event) => update(period, hour, event.target.value)}
          disabled={disabled}
          aria-label={`${ariaLabel} 분`}
          className={selectClass}
        >
          <option value="" disabled>
            분
          </option>
          {MINUTES.map((option) => (
            <option key={option} value={option}>
              {option}분
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}
