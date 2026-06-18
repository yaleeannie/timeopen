"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBookingUrl } from "@/lib/siteUrl";

type Props = {
  organizationId: string;
  initialLocation: string;
  initialNotice: string;
  initialName?: string;
  initialHandle?: string;
};

export default function ProfileEditor({
  organizationId,
  initialLocation,
  initialNotice,
  initialName = "",
  initialHandle = "",
}: Props) {
  const router = useRouter();

  const [loadingName, setLoadingName] = useState(false);
  const [loadingHandle, setLoadingHandle] = useState(false);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const [msg, setMsg] = useState("");

  const [shopName, setShopName] = useState(initialName ?? "");
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [locationText, setLocationText] = useState(initialLocation ?? "");
  const [noticeText, setNoticeText] = useState(initialNotice ?? "");

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
        setMsg(json?.error ?? "서비스명 저장 중 오류가 발생했습니다.");
        return;
      }

      setMsg("서비스명이 저장되었습니다.");
      router.refresh();
    } catch {
      setMsg("서비스명 저장 중 오류가 발생했습니다.");
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
        setMsg(json?.error ?? "예약 링크 저장 중 오류가 발생했습니다.");
        return;
      }

      setMsg("예약 링크가 저장되었습니다.");
      router.refresh();
    } catch {
      setMsg("예약 링크 저장 중 오류가 발생했습니다.");
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
      setMsg("예약 링크가 복사되었습니다.");
    } catch {
      setMsg("링크 복사에 실패했습니다.");
    }
  }

  return (
    <section className="grid min-w-0 gap-5">
      <div className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
        <div className="mb-4 text-base font-black">기본 정보</div>
        <div className="mb-5">
        <div className="mb-1.5 text-sm font-bold text-gray-700">서비스명</div>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="예: 지수헤어"
          className="min-h-11 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
        />

        <div className="mt-3">
          <button
            type="button"
            onClick={onSaveName}
            disabled={loadingName}
            className="min-h-11 rounded-xl bg-[#28b9dc] px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            {loadingName ? "저장 중..." : "서비스명 저장"}
          </button>
        </div>
      </div>

        <div>
        <div className="mb-1.5 text-sm font-bold text-gray-700">예약 링크</div>
        <input
          value={handle}
          onChange={(e) => {
            const v = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, "");
            setHandle(v);
          }}
          placeholder="예: jisu-hair (영어/숫자/-만)"
          className="min-h-11 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
        />

        <div className="mt-2 text-sm leading-5 text-gray-500">
          영어 소문자, 숫자, 하이픈(-)만 사용 가능 (3~30자)
        </div>

        <div className="mt-1 text-sm leading-5 text-gray-400">
          ※ 변경 시 기존 링크는 더 이상 사용되지 않을 수 있어요
        </div>

        <div className="mt-2 text-sm font-bold text-[#28b9dc] [overflow-wrap:anywhere]">
          {handle ? getBookingUrl(handle) : "-"}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onSaveHandle}
            disabled={loadingHandle}
            className="min-h-11 rounded-xl bg-[#28b9dc] px-3 py-2.5 text-sm font-black text-white disabled:opacity-60"
          >
            {loadingHandle ? "저장 중..." : "예약 링크 저장"}
          </button>

          <button
            type="button"
            onClick={onCopyLink}
            disabled={!handle}
            className="min-h-11 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-sm font-black text-[#5594a3] disabled:opacity-50"
          >
            링크 복사
          </button>
        </div>
      </div>

      </div>

      <div className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
      <div className="mb-4 text-base font-black">추가 정보</div>
      <div className="mb-1.5 text-sm font-bold text-gray-700">위치 안내 (선택)</div>
      <textarea
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
        rows={3}
        placeholder="예) 서울시 마포구 ... / 2층"
        className="mb-4 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
      />

      <div className="mb-1.5 text-sm font-bold text-gray-700">예약 안내문 (선택)</div>
      <textarea
        value={noticeText}
        onChange={(e) => setNoticeText(e.target.value)}
        rows={4}
        placeholder="예) 10분 전 도착 부탁드립니다. 지각 시 자동 취소될 수 있어요."
        className="mb-4 w-full min-w-0 rounded-xl border border-gray-200 px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
      />

      <button
        type="button"
        onClick={onSaveExtra}
        disabled={loadingExtra}
        className="min-h-11 w-full rounded-xl bg-[#28b9dc] px-4 py-2.5 text-sm font-black text-white disabled:opacity-60"
      >
        {loadingExtra ? "저장 중..." : "추가 정보 저장"}
      </button>

      {msg ? (
        <div className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold [overflow-wrap:anywhere] ${
          msg.includes("실패") || msg.includes("오류")
            ? "bg-red-50 text-red-700"
            : "bg-[#eef9fb] text-[#287f94]"
        }`}>
          {msg}
        </div>
      ) : null}
      </div>

      <div className="rounded-[24px] bg-gradient-to-br from-[#61a8fa] to-[#477eea] p-5 text-white shadow-[0_14px_30px_rgba(71,126,234,0.2)]">
      <div className="mb-4 text-base font-black">고객 화면 미리보기</div>

      <div className="mb-3">
        <div className="text-sm font-bold text-blue-100">서비스명</div>
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
