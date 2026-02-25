"use client";

import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
};

export default function DatePicker({ value, onChange }: Props) {
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">날짜 선택</h3>

      <div className="rounded-2xl border p-4 w-fit bg-white">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (!date) return onChange(null);
            onChange(date.toISOString().slice(0, 10));
          }}
        />
      </div>
    </div>
  );
}