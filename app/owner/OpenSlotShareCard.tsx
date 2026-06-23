"use client";

import { useMemo, useRef, useState } from "react";
import TimeSelect from "@/components/TimeSelect";
import { buildOpenSlotShareMessage } from "@/features/booking/openSlotShare";

type Props = {
  todayISO: string;
  bookingUrl: string;
  canLink: boolean;
};

export default function OpenSlotShareCard({
  todayISO,
  bookingUrl,
  canLink,
}: Props) {
  const [dateISO, setDateISO] = useState(todayISO);
  const [time, setTime] = useState("15:00");
  const [note, setNote] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const message = useMemo(
    () =>
      buildOpenSlotShareMessage({
        dateISO,
        time,
        note,
        bookingUrl,
        todayISO,
      }),
    [bookingUrl, dateISO, note, time, todayISO]
  );

  async function copyMessage() {
    if (!canLink || !bookingUrl) return;

    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("복사됨");
    } catch {
      setCopyStatus("복사 실패");
    }

    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(""), 1600);
  }

  return (
    <section className="glass-card mt-2.5 rounded-[22px] p-4" aria-labelledby="open-slot-share">
      <div>
        <h2 id="open-slot-share" className="text-base font-black text-slate-900">
          빈 시간 공유
        </h2>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
          예약 가능한 시간을 인스타 스토리나 DM에 바로 공유해보세요.
        </p>
      </div>

      {canLink ? (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-xs font-black text-slate-600">날짜</span>
              <input
                type="date"
                value={dateISO}
                min={todayISO}
                onChange={(event) => setDateISO(event.target.value || todayISO)}
                className="brand-input min-h-12 w-full rounded-2xl px-3 py-2.5 text-sm font-bold"
              />
            </label>
            <div>
              <span className="mb-1.5 block text-xs font-black text-slate-600">시간</span>
              <TimeSelect
                value={time}
                onChange={setTime}
                aria-label="공유할 예약 가능 시간"
              />
            </div>
          </div>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-xs font-black text-slate-600">
              한마디 추가 <span className="font-medium text-slate-400">(선택)</span>
            </span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={80}
              placeholder="예: 젤네일 가능해요"
              className="brand-input min-h-12 w-full rounded-2xl px-4 py-3 text-sm"
            />
          </label>

          <div className="brand-soft mt-4 rounded-[18px] p-4">
            <div className="text-[11px] font-black">공유 메시지 미리보기</div>
            <div className="mt-2 whitespace-pre-wrap break-words text-sm font-bold leading-6 text-slate-700">
              {message}
            </div>
          </div>

          <p className="mt-3 text-[11px] font-medium leading-5 text-slate-400">
            선택한 시간이 실제 예약 가능한지 한 번 확인한 뒤 공유해주세요.
          </p>

          <button
            type="button"
            onClick={copyMessage}
            className="brand-button mt-3 min-h-12 w-full rounded-2xl px-4 text-sm font-black"
          >
            {copyStatus || "공유 메시지 복사"}
          </button>
        </>
      ) : (
        <div className="brand-soft mt-4 rounded-2xl px-4 py-3 text-sm font-bold leading-6">
          먼저 인스타 예약 링크를 만들어주세요.
          <a href="/settings/profile" className="ml-1 underline underline-offset-2">
            샵 프로필에서 만들기
          </a>
        </div>
      )}
    </section>
  );
}
