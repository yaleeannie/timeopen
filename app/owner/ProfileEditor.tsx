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
  validateHandleValue,
} from "@/features/validation/fieldLimits";

type Props = {
  organizationId: string;
  initialLocation: string;
  initialNotice: string;
  initialName?: string;
  initialHandle?: string;
  initialTheme: LinkTheme;
  initialBookingEnabled: boolean;
  initialWithdrawalRequested: boolean;
  initialDisabled: boolean;
};

type HandleAvailability =
  | { state: "idle"; message: string; available: false }
  | { state: "checking"; message: string; available: false }
  | { state: "available"; message: string; available: true }
  | { state: "invalid" | "taken" | "error"; message: string; available: false };

export default function ProfileEditor({
  organizationId,
  initialLocation,
  initialNotice,
  initialName = "",
  initialHandle = "",
  initialTheme,
  initialBookingEnabled,
  initialWithdrawalRequested,
  initialDisabled,
}: Props) {
  const router = useRouter();

  const [loadingName, setLoadingName] = useState(false);
  const [loadingHandle, setLoadingHandle] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);
  const [loadingTheme, setLoadingTheme] = useState(false);
  const [loadingBookingStatus, setLoadingBookingStatus] = useState(false);
  const [loadingWithdrawal, setLoadingWithdrawal] = useState(false);

  const [msg, setMsg] = useState("");
  const [themeMsg, setThemeMsg] = useState("");
  const [bookingStatusMsg, setBookingStatusMsg] = useState("");
  const [withdrawalMsg, setWithdrawalMsg] = useState("");
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawalReason, setWithdrawalReason] = useState("");
  const [handleAvailability, setHandleAvailability] = useState<HandleAvailability>({
    state: "idle",
    message: "",
    available: false,
  });

  const [shopName, setShopName] = useState(initialName ?? "");
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [locationText, setLocationText] = useState(initialLocation ?? "");
  const [noticeText, setNoticeText] = useState(initialNotice ?? "");
  const [linkTheme, setLinkTheme] = useState<LinkTheme>(initialTheme);
  const [bookingEnabled, setBookingEnabled] = useState(initialBookingEnabled);
  const withdrawalRequested = initialWithdrawalRequested || initialDisabled;

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

  useEffect(() => {
    setBookingEnabled(initialBookingEnabled);
  }, [initialBookingEnabled]);

  useEffect(() => {
    const validation = validateHandleValue(handle);

    if (!handle.trim()) {
      setHandleAvailability({ state: "idle", message: "", available: false });
      return;
    }

    if (!validation.ok) {
      setHandleAvailability({
        state: "invalid",
        message: validation.error,
        available: false,
      });
      return;
    }

    setHandleAvailability({
      state: "checking",
      message: "예약 링크를 확인하고 있어요.",
      available: false,
    });

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams({ handle: validation.value });
        const res = await fetch(`/api/settings/handle?${params.toString()}`, {
          signal: controller.signal,
        });
        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json?.ok) {
          setHandleAvailability({
            state: "error",
            message: "예약 링크 확인 중 오류가 발생했어요.",
            available: false,
          });
          return;
        }

        if (json.valid === false) {
          setHandleAvailability({
            state: "invalid",
            message: json.reason ?? "영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있어요.",
            available: false,
          });
          return;
        }

        if (json.available === true) {
          setHandleAvailability({
            state: "available",
            message: "사용 가능한 예약 링크예요.",
            available: true,
          });
          return;
        }

        setHandleAvailability({
          state: "taken",
          message: "이미 사용 중인 예약 링크예요.",
          available: false,
        });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setHandleAvailability({
          state: "error",
          message: "예약 링크 확인 중 오류가 발생했어요.",
          available: false,
        });
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [handle]);

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
    const validation = validateHandleValue(handle);
    if (!validation.ok) {
      setMsg(validation.error);
      return;
    }

    if (!handleAvailability.available) {
      setMsg(handleAvailability.message || "예약 링크를 다시 확인해주세요.");
      return;
    }

    setLoadingHandle(true);
    setMsg("");

    try {
      const res = await fetch("/api/settings/handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: validation.value }),
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

  async function onSaveBookingStatus(nextEnabled = bookingEnabled) {
    setLoadingBookingStatus(true);
    setBookingStatusMsg("");

    try {
      const res = await fetch("/api/settings/booking-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_enabled: nextEnabled }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setBookingStatusMsg(json.error ?? "예약 접수 상태 저장 중 오류가 발생했습니다.");
        return;
      }

      setBookingEnabled(nextEnabled);
      setBookingStatusMsg(
        nextEnabled ? "예약 접수 상태가 켜졌습니다." : "예약 접수를 잠시 중지했습니다."
      );
      router.refresh();
    } catch {
      setBookingStatusMsg("예약 접수 상태 저장 중 오류가 발생했습니다.");
    } finally {
      setLoadingBookingStatus(false);
    }
  }

  async function onRequestWithdrawal() {
    setLoadingWithdrawal(true);
    setWithdrawalMsg("");

    try {
      const res = await fetch("/api/settings/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: withdrawalReason }),
      });
      const json: { error?: string } = await res.json().catch(() => ({}));

      if (!res.ok) {
        setWithdrawalMsg(json.error ?? "탈퇴 요청 처리 중 오류가 발생했습니다.");
        return;
      }

      window.location.href = "/login?withdrawal=requested";
    } catch {
      setWithdrawalMsg("탈퇴 요청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoadingWithdrawal(false);
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
            const v = normalizeHandleValue(e.target.value);
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

        {handleAvailability.message ? (
          <div
            className={`mt-2 rounded-xl px-3 py-2 text-xs font-black ${
              handleAvailability.state === "available"
                ? "brand-chip"
                : handleAvailability.state === "checking"
                  ? "brand-soft"
                  : "bg-red-50 text-red-700"
            }`}
          >
            {handleAvailability.message}
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSaveHandle}
            disabled={loadingHandle || !handleAvailability.available}
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
        <div className="text-base font-black">예약 접수 상태</div>
        <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
          여행, 휴무, 내부 일정이 있을 때 예약 링크를 잠시 닫을 수 있어요.
        </p>

        <div className="mt-4 grid gap-2">
          {[
            {
              value: true,
              title: "예약 받는 중",
              description: "고객이 인스타 예약 링크에서 바로 예약할 수 있어요.",
            },
            {
              value: false,
              title: "예약 잠시 중지",
              description: "고객에게는 예약을 잠시 받고 있지 않다는 안내가 보여요.",
            },
          ].map((option) => {
            const selected = bookingEnabled === option.value;
            return (
              <button
                key={option.title}
                type="button"
                onClick={() => void onSaveBookingStatus(option.value)}
                disabled={loadingBookingStatus}
                className={`rounded-2xl border px-4 py-3 text-left transition disabled:opacity-60 ${
                  selected
                    ? "border-[#00C1FF] bg-[#E9FAFF] shadow-[0_10px_26px_rgba(0,193,255,0.14)]"
                    : "border-white/80 bg-white/55 hover:border-[#00C1FF]/45"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-slate-900">{option.title}</div>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                      selected ? "brand-selected" : "border border-slate-200 bg-white text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium leading-5 text-gray-500">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {bookingStatusMsg ? (
          <div
            className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold ${
              bookingStatusMsg.includes("오류")
                ? "bg-red-50 text-red-700"
                : "brand-chip"
            }`}
          >
            {bookingStatusMsg}
          </div>
        ) : null}
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

      <div className="rounded-[24px] border border-red-100 bg-white/70 p-4 backdrop-blur">
        <div className="text-base font-black text-red-700">계정 관리</div>
        <p className="mt-1 text-sm font-medium leading-6 text-gray-500">
          탈퇴를 요청하면 예약 링크가 닫히고, 이후 데이터 삭제는 확인 후 진행돼요.
        </p>
        {withdrawalRequested ? (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700">
            이미 탈퇴 요청이 접수되었습니다. 예약 링크는 닫힌 상태예요.
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setWithdrawalModalOpen(true)}
            className="mt-4 min-h-11 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100"
          >
            회원 탈퇴하기
          </button>
        )}
      </div>

      {withdrawalModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdrawal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <h2
              id="withdrawal-title"
              className="text-2xl font-black tracking-[-0.04em] text-slate-950"
            >
              정말 탈퇴하시겠어요?
            </h2>
            <p className="mt-3 text-sm font-medium leading-6 text-gray-500">
              탈퇴를 요청하면 예약 링크가 닫히고 더 이상 고객이 예약할 수 없어요.
              기존 예약 및 데이터는 확인 후 처리됩니다.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-black text-gray-700">
                탈퇴 사유를 알려주세요. 더 나은 TimeOpen을 만드는 데 도움이 돼요.
              </span>
              <textarea
                value={withdrawalReason}
                onChange={(event) => setWithdrawalReason(event.target.value)}
                rows={4}
                maxLength={FIELD_LIMITS.withdrawalReasonMax}
                className="brand-input w-full resize-none rounded-2xl px-4 py-3 text-base"
                placeholder="선택 입력"
              />
              <span className="mt-1 block text-right text-xs font-bold text-gray-400">
                {withdrawalReason.length}/{FIELD_LIMITS.withdrawalReasonMax}
              </span>
            </label>

            {withdrawalMsg ? (
              <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                {withdrawalMsg}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setWithdrawalModalOpen(false);
                  setWithdrawalMsg("");
                }}
                disabled={loadingWithdrawal}
                className="min-h-12 rounded-2xl border border-[#dcecef] bg-white px-4 text-sm font-black text-gray-500 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onRequestWithdrawal}
                disabled={loadingWithdrawal}
                className="min-h-12 rounded-2xl bg-red-600 px-4 text-sm font-black text-white shadow-[0_14px_30px_rgba(220,38,38,0.18)] disabled:opacity-50"
              >
                {loadingWithdrawal ? "처리 중..." : "탈퇴 요청하기"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
