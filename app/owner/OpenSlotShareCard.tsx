"use client";

import { useMemo, useRef, useState } from "react";
import TimeSelect from "@/components/TimeSelect";
import { buildOpenSlotShareMessage } from "@/features/booking/openSlotShare";
import {
  buildOpenSlotStorySvg,
  storySvgDataUrl,
} from "@/features/booking/openSlotStory";
import {
  PUBLIC_BOOKING_THEMES,
  type LinkTheme,
} from "@/features/booking/themes";

type Props = {
  todayISO: string;
  bookingUrl: string;
  canLink: boolean;
  storeName: string;
  linkTheme: LinkTheme;
};

export default function OpenSlotShareCard({
  todayISO,
  bookingUrl,
  canLink,
  storeName,
  linkTheme,
}: Props) {
  const [dateISO, setDateISO] = useState(todayISO);
  const [time, setTime] = useState("15:00");
  const [note, setNote] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [downloadStatus, setDownloadStatus] = useState("");
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
  const theme = PUBLIC_BOOKING_THEMES[linkTheme];
  const storySvg = useMemo(
    () =>
      buildOpenSlotStorySvg({
        dateISO,
        time,
        note,
        shopName: storeName,
        todayISO,
        theme: {
          primary: theme.variables["--brand-primary"],
          accent: theme.variables["--brand-accent"],
          soft: theme.variables["--brand-soft"],
        },
      }),
    [dateISO, note, storeName, theme, time, todayISO]
  );
  const storyPreviewUrl = useMemo(() => storySvgDataUrl(storySvg), [storySvg]);

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

  async function downloadStoryImage() {
    setDownloadStatus("이미지 만드는 중...");
    let svgObjectUrl = "";

    try {
      const image = new Image();
      svgObjectUrl = URL.createObjectURL(
        new Blob([storySvg], { type: "image/svg+xml;charset=utf-8" })
      );

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("이미지를 만들지 못했습니다."));
        image.src = svgObjectUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas를 사용할 수 없습니다.");

      context.drawImage(image, 0, 0, 1080, 1920);

      const pngBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("PNG 변환에 실패했습니다."));
        }, "image/png");
      });
      const downloadUrl = URL.createObjectURL(pngBlob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `timeopen-open-slot-${dateISO}-${time.replace(":", "")}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      setDownloadStatus("저장 완료");
    } catch {
      setDownloadStatus("저장 실패");
    } finally {
      if (svgObjectUrl) URL.revokeObjectURL(svgObjectUrl);
    }

    window.setTimeout(() => setDownloadStatus(""), 1800);
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

          <div className="mt-5 border-t border-white/70 pt-5">
            <div className="text-base font-black text-slate-900">스토리 이미지</div>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
              빈 시간을 인스타 스토리용 이미지로 저장해보세요.
            </p>

            <div className="mx-auto mt-4 w-full max-w-[230px] overflow-hidden rounded-[24px] border border-white/85 bg-white shadow-[0_18px_48px_rgba(30,100,135,0.14)]">
              <img
                src={storyPreviewUrl}
                alt={`${storeName} 빈 시간 스토리 이미지 미리보기`}
                className="aspect-[9/16] h-auto w-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={downloadStoryImage}
              className="brand-outline mt-4 min-h-12 w-full rounded-2xl px-4 text-sm font-black"
            >
              {downloadStatus || "스토리 이미지 저장"}
            </button>
            <p className="mt-3 text-[11px] font-medium leading-5 text-slate-400">
              다운로드한 이미지를 인스타 스토리에 올리고 예약 링크를 함께 공유해보세요.
            </p>
          </div>
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
