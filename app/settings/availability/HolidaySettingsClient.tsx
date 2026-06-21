"use client";

import { useEffect, useState } from "react";

type Holiday = {
  id: string;
  date: string;
  note: string | null;
  created_at: string;
};

function formatHolidayDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

export default function HolidaySettingsClient() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function loadHolidays() {
    setLoading(true);
    const response = await fetch("/api/settings/holidays", { cache: "no-store" });
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(json?.error ?? "휴무일을 불러오지 못했습니다.");
      setLoading(false);
      return;
    }

    setHolidays(json.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void loadHolidays();
  }, []);

  async function addHoliday() {
    setMessage("");

    if (!date) {
      setMessage("날짜를 선택해주세요.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/settings/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, note }),
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(json?.error ?? "휴무일 저장에 실패했습니다.");
        return;
      }

      setDate("");
      setNote("");
      setMessage("휴무일이 저장되었습니다.");
      await loadHolidays();
    } catch {
      setMessage("네트워크 오류입니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHoliday(id: string) {
    setMessage("");
    setDeletingId(id);

    try {
      const response = await fetch("/api/settings/holidays", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(json?.error ?? "휴무일 삭제에 실패했습니다.");
        return;
      }

      setHolidays((current) => current.filter((holiday) => holiday.id !== id));
      setMessage("휴무일이 삭제되었습니다.");
    } catch {
      setMessage("네트워크 오류입니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section aria-labelledby="holidays-title">
      <div className="px-1">
        <h2 id="holidays-title" className="text-xl font-black tracking-[-0.03em]">
          휴무일 설정
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
          특정 날짜에는 예약을 받지 않도록 설정할 수 있어요.
        </p>
      </div>

      <div className="mt-4 rounded-[22px] border border-[#e1eef0] bg-white p-4 shadow-sm">
        <div className="grid gap-4">
          <label>
            <span className="mb-2 block text-sm font-black text-gray-700">날짜</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#dcecef] bg-white px-4 py-3 text-base outline-none focus:border-[#4fcbe6] focus:ring-4 focus:ring-cyan-50"
            />
          </label>
          <label>
            <span className="mb-2 block text-sm font-black text-gray-700">
              메모 <span className="font-medium text-gray-400">(선택)</span>
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="예: 여름휴가"
              maxLength={200}
              className="min-h-12 w-full rounded-2xl border border-[#dcecef] bg-white px-4 py-3 text-base outline-none placeholder:text-gray-400 focus:border-[#4fcbe6] focus:ring-4 focus:ring-cyan-50"
            />
          </label>
          <button
            type="button"
            onClick={addHoliday}
            disabled={saving}
            className="min-h-12 rounded-2xl bg-[#28b9dc] px-4 text-sm font-black text-white disabled:opacity-50"
          >
            {saving ? "저장 중..." : "+ 휴무일 추가"}
          </button>
        </div>
      </div>

      {message ? (
        <div className="mt-3 rounded-2xl bg-[#f1f9fb] px-4 py-3 text-sm font-bold text-[#397582]">
          {message}
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        {loading ? (
          <div className="rounded-2xl bg-white px-4 py-5 text-sm font-medium text-gray-400">
            휴무일을 불러오는 중...
          </div>
        ) : holidays.length > 0 ? (
          holidays.map((holiday) => (
            <div
              key={holiday.id}
              className="flex items-center justify-between gap-4 rounded-[20px] border border-[#e5f3f6] bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <div className="font-black text-gray-900">
                  {formatHolidayDate(holiday.date)}
                </div>
                <div className="mt-1 truncate text-sm text-gray-500">
                  {holiday.note || "메모 없음"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => deleteHoliday(holiday.id)}
                disabled={deletingId === holiday.id}
                className="min-h-10 shrink-0 rounded-xl bg-red-50 px-3 text-sm font-black text-red-600 disabled:opacity-50"
              >
                {deletingId === holiday.id ? "삭제 중..." : "삭제"}
              </button>
            </div>
          ))
        ) : (
          <div className="rounded-2xl bg-white px-4 py-5 text-sm font-medium text-gray-400">
            등록된 휴무일이 없어요.
          </div>
        )}
      </div>
    </section>
  );
}
