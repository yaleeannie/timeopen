"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
    const link = `${window.location.origin}/u/${handle}`;
    try {
      await navigator.clipboard.writeText(link);
      setMsg("예약 링크가 복사되었습니다.");
    } catch {
      setMsg("링크 복사에 실패했습니다.");
    }
  }

  return (
    <section style={{ marginTop: 18, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
      <div style={{ fontWeight: 900, marginBottom: 10 }}>기본 정보</div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>서비스명</div>
        <input
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="예: 지수헤어"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
            outline: "none",
          }}
        />

        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={onSaveName}
            disabled={loadingName}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 800,
              opacity: loadingName ? 0.7 : 1,
            }}
          >
            {loadingName ? "저장 중..." : "서비스명 저장"}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>예약 링크</div>
        <input
          value={handle}
          onChange={(e) => {
            const v = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, "");
            setHandle(v);
          }}
          placeholder="예: jisu-hair (영어/숫자/-만)"
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid #ddd",
            outline: "none",
          }}
        />

        <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
          영어 소문자, 숫자, 하이픈(-)만 사용 가능 (3~30자)
        </div>

        <div style={{ marginTop: 4, fontSize: 12, color: "#999" }}>
          ※ 변경 시 기존 링크는 더 이상 사용되지 않을 수 있어요
        </div>

        <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
          {handle ? `/u/${handle}` : "-"}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button
            type="button"
            onClick={onSaveHandle}
            disabled={loadingHandle}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 800,
              opacity: loadingHandle ? 0.7 : 1,
            }}
          >
            {loadingHandle ? "저장 중..." : "예약 링크 저장"}
          </button>

          <button
            type="button"
            onClick={onCopyLink}
            disabled={!handle}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              fontWeight: 800,
              opacity: !handle ? 0.5 : 1,
            }}
          >
            링크 복사
          </button>
        </div>
      </div>

      <hr style={{ margin: "20px 0" }} />

      <div style={{ fontWeight: 900, marginBottom: 10 }}>추가 정보</div>

      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>위치 안내 (선택)</div>
      <textarea
        value={locationText}
        onChange={(e) => setLocationText(e.target.value)}
        rows={3}
        placeholder="예) 서울시 마포구 ... / 2층"
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 10,
          border: "1px solid #ddd",
          outline: "none",
          marginBottom: 12,
        }}
      />

      <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 6 }}>예약 안내문 (선택)</div>
      <textarea
        value={noticeText}
        onChange={(e) => setNoticeText(e.target.value)}
        rows={4}
        placeholder="예) 10분 전 도착 부탁드립니다. 지각 시 자동 취소될 수 있어요."
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 10,
          border: "1px solid #ddd",
          outline: "none",
          marginBottom: 12,
        }}
      />

      <button
        type="button"
        onClick={onSaveExtra}
        disabled={loadingExtra}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #111",
          background: "#111",
          color: "#fff",
          fontWeight: 900,
          opacity: loadingExtra ? 0.7 : 1,
        }}
      >
        {loadingExtra ? "저장 중..." : "추가 정보 저장"}
      </button>

      {msg ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            fontWeight: 800,
            color: msg.includes("실패") || msg.includes("오류") ? "#b00020" : "#111",
          }}
        >
          {msg}
        </div>
      ) : null}

      <hr style={{ margin: "24px 0" }} />

      <div style={{ fontWeight: 900, marginBottom: 8 }}>고객 화면 표시 미리보기</div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 800 }}>서비스명</div>
        <div>{shopName || "-"}</div>
      </div>

      {locationText.trim() ? (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 800 }}>📍 위치</div>
          <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{locationText}</div>
        </div>
      ) : null}

      {noticeText.trim() ? (
        <div>
          <div style={{ fontWeight: 800 }}>📢 예약 안내</div>
          <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{noticeText}</div>
        </div>
      ) : null}

      {!shopName.trim() && !locationText.trim() && !noticeText.trim() ? (
        <div style={{ fontSize: 13, color: "#666" }}>아직 입력된 내용이 없습니다.</div>
      ) : null}
    </section>
  );
}