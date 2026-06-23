"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookingUrl } from "@/lib/siteUrl";
import {
  LINK_THEME_NAMES,
  PUBLIC_BOOKING_THEMES,
  type LinkTheme,
} from "@/features/booking/themes";
import {
  FIELD_LIMITS,
  normalizeHandleValue,
} from "@/features/validation/fieldLimits";

type Props = {
  organizationId: string;
  initialLocation: string;
  initialNotice: string;
  initialName?: string;
  initialHandle?: string;
  initialTheme: LinkTheme;
};

export default function ProfileEditor({
  organizationId,
  initialLocation,
  initialNotice,
  initialName = "",
  initialHandle = "",
  initialTheme,
}: Props) {
  const router = useRouter();

  const [loadingName, setLoadingName] = useState(false);
  const [loadingHandle, setLoadingHandle] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [loadingTheme, setLoadingTheme] = useState(false);

  const [msg, setMsg] = useState("");
  const [themeMsg, setThemeMsg] = useState("");

  const [shopName, setShopName] = useState(initialName ?? "");
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [locationText, setLocationText] = useState(initialLocation ?? "");
  const [noticeText, setNoticeText] = useState(initialNotice ?? "");
  const [linkTheme, setLinkTheme] = useState<LinkTheme>(initialTheme);

  useEffect(() => {
    setShopName(initialName ?? "");
  }, [initialName]);

  useEffect(() => {
    setHandle(initialHandle ?? "");
  }, [initialHandle]);

  useEffect(() => {
    setLocationText(initialLocation ?? "");
  }, [initialLocation]);

  useEffect(() => {
    setNoticeText(initialNotice ?? "");
  }, [initialNotice]);

  useEffect(() => {
    setLinkTheme(initialTheme);
  }, [initialTheme]);

  async function onSaveName() {
    setLoadingName(true);
    setMsg("");

    try {
      const res = await fetch("/api/settings/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: shopName }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? "샵 이름 저장 중 오류가 발생했습니다.");
        return;
      }

      setMsg("샵 이름이 저장되었습니다.");
      router.refresh();
    } catch {
      setMsg("샵 이름 저장 중 오류가 발생했습니다.");
    } finally {
      setLoadingName(false);
    }
  }

  async function onSaveHandle() {
    setLoadingHandle(true);
    setMsg("");

    try {
      const res = await fetch("/api/settings/handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? "인스타 예약 링크 저장 중 오류가 발생했습니다.");
        return;
      }

      setMsg("인스타 예약 링크가 저장되었습니다.");
      router.refresh();
    } catch {
      setMsg("인스타 예약 링크 저장 중 오류가 발생했습니다.");
    } finally {
      setLoadingHandle(false);
    }
  }

  async function onSaveExtra() {
    setLoadingExtra(true);
    setMsg("");

    try {
      const res = await fetch("/api/owner/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          location_text: locationText,
          notice_text: noticeText,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? "추가 정보 저장 중 오류가 발생했습니다.");
        return;
      }

      setMsg("추가 정보가 저장되었습니다.");
      router.refresh();
    } catch {
      setMsg("추가 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setLoadingExtra(false);
    }
  }

  async function onCopyLink() {
    const link = getBookingUrl(handle);
    try {
      await navigator.clipboard.writeText(link);
      setMsg("인스타 예약 링크가 복사되었습니다.");
    } catch {
      setMsg("링크 복사에 실패했습니다.");
    }
  }

  async function onSaveTheme() {
    setLoadingTheme(true);
    setThemeMsg("");

    try {
      const res = await fetch("/api/settings/link-theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link_theme: linkTheme }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setThemeMsg(json.error ?? "예약 링크 테마 저장 중 오류가 발생했습니다.");
        return;
      }

      setThemeMsg("인스타 예약 링크 테마가 저장되었습니다.");
      router.refresh();
    } catch {
      setThemeMsg("예약 링크 테마 저장 중 오류가 발생했습니다.");
    } finally {
      setLoadingTheme(false);
    }
  }

  return (
    <section className="grid min-w-0 gap-5">
      <div className="glass-card rounded-[24px] p-4">
        <div className="mb-4 text-base font-black">기본 정보</div>
        <div className="mb-5">
        <div className="mb-1.5 text-sm font-bold text-gray-700">샵 이름</div>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="예: 지수헤어"
          maxLength={FIELD_LIMITS.shopNameMax}
          className="brand-input min-h-11 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
        />

        <div className="mt-3">
          <button
            type="button"
            onClick={onSaveName}
            disabled={loadingName}
            className="brand-button min-h-11 rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-60"
          >
            {loadingName ? "저장 중..." : "샵 이름 저장"}
          </button>
        </div>
      </div>

        <div>
        <div className="mb-1.5 text-sm font-bold text-gray-700">인스타 예약 링크</div>
        <input
          value={handle}
          onChange={(e) => {
            const v = normalizeHandleValue(e.target.value).replace(/[^a-z0-9_-]/g, "");
            setHandle(v);
          }}
          placeholder="예: jisu_hair"
          maxLength={FIELD_LIMITS.handleMax}
          className="brand-input min-h-11 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
        />

        <div className="mt-2 text-sm leading-5 text-gray-500">
          인스타 프로필에 복사할 주소예요. 영어 소문자, 숫자, 하이픈(-), 언더스코어(_)를 3~30자로 사용할 수 있어요.
        </div>

        <div className="mt-1 text-sm leading-5 text-gray-400">
          ※ 변경 시 기존 링크는 더 이상 사용되지 않을 수 있어요
        </div>

        <div className="brand-text mt-2 text-sm font-bold [overflow-wrap:anywhere]">
          {handle ? getBookingUrl(handle) : "-"}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSaveHandle}
            disabled={loadingHandle}
            className="brand-button min-h-11 rounded-xl px-3 py-2.5 text-sm font-black disabled:opacity-60"
          >
            {loadingHandle ? "저장 중..." : "인스타 예약 링크 저장"}
          </button>

          <button
            type="button"
            onClick={onCopyLink}
            disabled={!handle}
            className="brand-outline min-h-11 rounded-xl px-3 py-2.5 text-sm font-black disabled:opacity-50"
          >
            링크 복사
          </button>
        </div>
      </div>

      </div>

      <div className="glass-card rounded-[24px] p-4">
      <div className="mb-4 text-base font-black">추가 정보</div>
      <div className="mb-1.5 text-sm font-bold text-gray-700">위치 안내 (선택)</div>
      <textarea
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
        rows={3}
        placeholder="예) 서울시 마포구 ... / 2층"
        maxLength={FIELD_LIMITS.noticeMax}
        className="brand-input mb-4 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
      />
      <div className="-mt-3 mb-4 text-right text-xs font-bold text-gray-400">
        {locationText.length}/{FIELD_LIMITS.noticeMax}
      </div>

      <div className="mb-1.5 text-sm font-bold text-gray-700">예약 안내문 (선택)</div>
      <textarea
        value={noticeText}
        onChange={(e) => setNoticeText(e.target.value)}
        rows={4}
        placeholder="예) 10분 전 도착 부탁드립니다. 지각 시 자동 취소될 수 있어요."
        maxLength={FIELD_LIMITS.noticeMax}
        className="brand-input mb-4 w-full min-w-0 rounded-xl px-3 py-2.5 text-base"
      />
      <div className="-mt-3 mb-4 text-right text-xs font-bold text-gray-400">
        {noticeText.length}/{FIELD_LIMITS.noticeMax}
      </div>

      <button
        type="button"
        onClick={onSaveExtra}
        disabled={loadingExtra}
        className="brand-button min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-60"
      >
        {loadingExtra ? "저장 중..." : "추가 정보 저장"}
      </button>

      {msg ? (
        <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold [overflow-wrap:anywhere] ${
          msg.includes("실패") || msg.includes("오류")
            ? "bg-red-50 text-red-700"
            : "brand-chip"
        }`}>
          {msg}
        </div>
      ) : null}
      </div>

      <div className="glass-card rounded-[24px] p-4">
        <div className="text-base font-black">인스타 예약 링크 테마</div>
        <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
          고객에게 보여지는 예약 페이지의 분위기를 선택해요.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {LINK_THEME_NAMES.map((themeName) => {
            const theme = PUBLIC_BOOKING_THEMES[themeName];
            const selected = linkTheme === themeName;

            return (
              <button
                key={themeName}
                type="button"
                aria-pressed={selected}
                onClick={() => setLinkTheme(themeName)}
                className={`overflow-hidden rounded-[20px] border p-2.5 text-left transition ${
                  selected
                    ? "border-[#00C1FF] bg-[#E9FAFF] shadow-[0_10px_26px_rgba(0,193,255,0.14)]"
                    : "border-white/80 bg-white/55 hover:border-[#00C1FF]/45"
                }`}
              >
                <div className={`h-24 rounded-2xl p-2.5 ${theme.preview}`}>
                  <div className={`h-full rounded-xl border p-2 ${theme.previewCard}`}>
                    <div className={`h-2 w-10 rounded-full ${theme.previewAccent}`} />
                    <div className="mt-2 h-2 w-16 rounded-full bg-slate-300/65" />
                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                      <div className="h-7 rounded-lg bg-white/85" />
                      <div className={`h-7 rounded-lg ${theme.previewAccent}`} />
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                  <span className="text-sm font-black text-slate-800">{theme.label}</span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                      selected ? "brand-selected" : "border border-slate-200 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onSaveTheme}
          disabled={loadingTheme}
          className="brand-button mt-4 min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-black disabled:opacity-60"
        >
          {loadingTheme ? "저장 중..." : "선택한 테마 저장"}
        </button>
        {themeMsg ? (
          <div
            className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold [overflow-wrap:anywhere] ${
              themeMsg.includes("오류") || themeMsg.includes("지원하지")
                ? "bg-red-50 text-red-700"
                : "brand-chip"
            }`}
          >
            {themeMsg}
          </div>
        ) : null}
      </div>

      <div className="brand-gradient rounded-[24px] p-5 text-white shadow-[0_14px_30px_rgba(0,193,255,0.22)]">
      <div className="mb-4 text-base font-black">고객 화면 미리보기</div>

      <div className="mb-3">
        <div className="text-sm font-bold text-blue-100">샵 이름</div>
        <div className="mt-1 break-words font-black [overflow-wrap:anywhere]">{shopName || "-"}</div>
      </div>

      {locationText.trim() ? (
        <div className="mb-3">
          <div className="text-sm font-bold text-blue-100">위치</div>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-5 [overflow-wrap:anywhere]">{locationText}</div>
        </div>
      ) : null}

      {noticeText.trim() ? (
        <div>
          <div className="text-sm font-bold text-blue-100">예약 안내</div>
          <div className="mt-1 whitespace-pre-wrap text-sm leading-5 [overflow-wrap:anywhere]">{noticeText}</div>
        </div>
      ) : null}

      {!shopName.trim() && !locationText.trim() && !noticeText.trim() ? (
        <div className="text-sm text-blue-100">아직 입력된 내용이 없습니다.</div>
      ) : null}
      </div>
    </section>
  );
}
