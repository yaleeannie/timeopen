"use client";

import { useState } from "react";

export default function HandleSetup() {
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSave() {
    const v = handle.trim().toLowerCase();

    if (v.length < 3 || v.length > 30) {
      setMsg("주소는 3~30자로 입력해 주세요.");
      return;
    }
    if (!/^[a-z0-9-]+$/.test(v)) {
      setMsg("영문/숫자/하이픈(-)만 사용할 수 있어요.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/owner/set-handle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: v }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const m = String(json?.error ?? "저장 실패");
        if (m.includes("already taken")) setMsg("이미 사용 중인 주소입니다.");
        else setMsg(m);
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ marginBottom: 10 }}>예약 페이지 주소를 만들어주세요</h1>

      <div style={{ marginBottom: 12, color: "#444" }}>
        https://timeopen.app/u/<b>[입력값]</b>
      </div>

      <input
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder="예) my-shop"
        style={{ width: 320, padding: 12, border: "1px solid #ccc", borderRadius: 10 }}
      />

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={onSave}
          disabled={loading}
          style={{ padding: "10px 14px", borderRadius: 10, border: "1px solid #111", background: "#111", color: "#fff" }}
        >
          {loading ? "저장 중..." : "저장"}
        </button>
      </div>

      {msg ? <div style={{ marginTop: 12, color: "#b00020" }}>{msg}</div> : null}

      <div style={{ marginTop: 12, fontSize: 12, color: "#666" }}>
        영문/숫자/하이픈만 가능, 3~30자
      </div>
    </main>
  );
}