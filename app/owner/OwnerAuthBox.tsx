"use client";

import { useState } from "react";

type Props = {
  isAuthed: boolean;
  emailPrefill?: string;
};

export default function OwnerAuthBox({ isAuthed, emailPrefill = "" }: Props) {
  const [email, setEmail] = useState(emailPrefill);
  const [status, setStatus] = useState<string>("");

  async function sendMagicLink() {
    setStatus("");
    const e = email.trim();
    if (!e) {
      setStatus("이메일을 입력해줘.");
      return;
    }

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 서버가 주는 에러 메시지 그대로 보여주기 (rate limit 포함)
        setStatus(json?.error ?? `로그인 메일 전송 실패 (HTTP ${res.status})`);
        return;
      }

      setStatus("메일 보냈어! 메일함에서 로그인 링크 눌러줘.");
    } catch (err: any) {
      setStatus(err?.message ?? "요청 중 오류가 발생했어.");
    }
  }

  async function logout() {
    setStatus("");
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setStatus(json?.error ?? "로그아웃 실패");
        return;
      }
      // 로그아웃 후 새로고침해서 서버에서 user 다시 읽게
      window.location.reload();
    } catch (err: any) {
      setStatus(err?.message ?? "로그아웃 중 오류");
    }
  }

  return (
    <div
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 12,
        padding: 12,
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <input
        placeholder="owner 이메일 입력"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          minWidth: 240,
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #ddd",
        }}
        disabled={isAuthed} // 로그인 상태면 이메일 입력 막기
      />

      {!isAuthed ? (
        <button
          type="button"
          onClick={sendMagicLink}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
          로그인 메일 보내기
        </button>
      ) : (
        <button
          type="button"
          onClick={logout}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "white",
            cursor: "pointer",
          }}
        >
          로그아웃
        </button>
      )}

      <div style={{ width: "100%", fontSize: 12, color: "#666" }}>
        {isAuthed ? "✅ 로그인됨" : "ℹ️ 메일에서 링크를 누르면 자동으로 로그인돼야 해."}
        {status ? <div style={{ marginTop: 6, color: "#b00020" }}>{status}</div> : null}
      </div>
    </div>
  );
}