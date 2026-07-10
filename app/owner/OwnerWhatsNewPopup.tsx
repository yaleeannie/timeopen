"use client";

import { useCallback, useEffect, useState } from "react";

export const OWNER_WHATS_NEW_STORAGE_KEY = "timeopen-whats-new-2026-07-10";

const updates = [
  {
    badge: "1",
    title: "예약 시간 단위 설정",
    body: "10분·15분·30분·1시간 중 샵에 맞는 간격을 선택할 수 있어요.",
  },
  {
    badge: "2",
    title: "직접 예약 추가",
    body: "전화나 DM으로 받은 예약도 예약관리에서 바로 추가할 수 있어요.",
  },
  {
    badge: "3",
    title: "시간 막기",
    body: "개인 일정이나 쉬는 시간은 고객 예약이 들어오지 않도록 막을 수 있어요.",
  },
];

export default function OwnerWhatsNewPopup() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);

    try {
      setOpen(window.localStorage.getItem(OWNER_WHATS_NEW_STORAGE_KEY) !== "dismissed");
    } catch {
      setOpen(false);
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(OWNER_WHATS_NEW_STORAGE_KEY, "dismissed");
    } catch {
      // localStorage may be unavailable in private or restricted browser contexts.
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dismiss, open]);

  if (!mounted || !open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/10 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="owner-whats-new-title"
        className="max-h-[calc(100vh-48px)] w-full max-w-md overflow-y-auto rounded-3xl border border-sky-100 bg-white p-5 text-slate-900 shadow-[0_24px_80px_rgba(14,165,233,0.14)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-500">
              What&apos;s New
            </p>
            <h2
              id="owner-whats-new-title"
              className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950"
            >
              TimeOpen이 더 편해졌어요 ✨
            </h2>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
              샵 운영에 꼭 필요한 기능들이 새로 추가됐어요.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-black text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
            aria-label="업데이트 안내 닫기"
          >
            ×
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {updates.map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-sky-500 shadow-sm">
                {item.badge}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black text-slate-900">{item.title}</div>
                <p className="mt-1 text-sm font-medium leading-5 text-slate-600">
                  {item.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-5 min-h-12 w-full rounded-2xl bg-[#00c9ff] px-4 text-sm font-black text-white shadow-[0_14px_32px_rgba(0,201,255,0.24)] transition hover:bg-sky-400"
        >
          확인했어요
        </button>
      </div>
    </div>
  );
}
