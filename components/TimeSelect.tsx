import type { SelectHTMLAttributes } from "react";

type TimeSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowEmpty?: boolean;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange">;

const TIME_OPTIONS = Array.from({ length: 24 * 6 }, (_, index) => {
  const hour = Math.floor(index / 6);
  const minute = (index % 6) * 10;
  const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;

  return {
    value,
    label: `${period} ${String(displayHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
});

const VALID_TIME_VALUES = new Set(TIME_OPTIONS.map(({ value }) => value));

export default function TimeSelect({
  value,
  onChange,
  placeholder = "시간 선택",
  allowEmpty = false,
  className = "",
  ...selectProps
}: TimeSelectProps) {
  const hasUnsupportedValue = Boolean(value) && !VALID_TIME_VALUES.has(value);
  const selectValue = hasUnsupportedValue ? "" : value;
  const emptyLabel = hasUnsupportedValue
    ? `현재 ${value} · 새 시간 선택`
    : allowEmpty
      ? "선택 안 함"
      : placeholder;

  return (
    <div className="relative min-w-0">
      <select
        {...selectProps}
        value={selectValue}
        onChange={(event) => onChange(event.target.value)}
        className={`min-h-12 w-full appearance-none rounded-2xl border border-[#dcecef] bg-white py-3 pl-3 pr-9 text-sm font-bold text-gray-900 outline-none transition focus:border-[#4fcbe6] focus:ring-4 focus:ring-cyan-50 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
      >
        <option value="" disabled={!allowEmpty && !hasUnsupportedValue}>
          {emptyLabel}
        </option>
        {TIME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#21aeca]"
      >
        <path
          d="m6 8 4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
