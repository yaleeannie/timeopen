"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  organizationId: string;
  initialLocation: string;
  initialNotice: string;
};

export default function ProfileEditor({
  organizationId,
  initialLocation,
  initialNotice,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const [locationText, setLocationText] = useState(initialLocation ?? "");
  const [noticeText, setNoticeText] = useState(initialNotice ?? "");

  useEffect(() => {
    setLocationText(initialLocation ?? "");
  }, [initialLocation]);

  useEffect(() => {
    setNoticeText(initialNotice ?? "");
  }, [initialNotice]);

  async function onSave() {
    setLoading(true);
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
        setMsg(json?.error ?? "저장 중 오류가 발생했습니다.");
        return;
      }

      setMsg("저장되었습니다.");
      router.refresh();
    } catch {
      setMsg("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ marginTop: 18, padding: 14, border: "1px solid #eee", borderRadius: 12 }}>
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
        onClick={onSave}
        disabled={loading}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #111",
          background: "#111",
          color: "#fff",
          fontWeight: 900,
          opacity: loading ? 0.7 : 1,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "저장 중..." : "저장"}
      </button>

      {msg ? (
        <div
          style={{
            marginTop: 10,
            fontSize: 13,
            fontWeight: 800,
            color: msg === "저장되었습니다." ? "#111" : "#b00020",
          }}
        >
          {msg}
        </div>
      ) : null}

      <hr style={{ margin: "24px 0" }} />

      <div style={{ fontWeight: 900, marginBottom: 8 }}>고객 화면 표시 미리보기</div>

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

      {!locationText.trim() && !noticeText.trim() ? (
        <div style={{ fontSize: 13, color: "#666" }}>아직 입력된 내용이 없습니다.</div>
      ) : null}
    </section>
  );
}