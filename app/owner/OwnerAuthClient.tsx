"use client";

import { useEffect, useState } from "react";

type Props = {
  initialEmail?: string;
};

export default function OwnerAuthClient({ initialEmail = "" }: Props) {
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 메시지 자동 삭제 (너무 오래 남아있지 않게)
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 3500);
    return () => clearTimeout(t);
  }, [msg]);

  async function sendMagicLink() {
    const v = email.trim();

    if (!v) {
      setMsg("이메일을 입력해줘!");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? "로그인 메일 전송 실패");
        return;
      }

      setMsg("로그인 메일을 보냈어! 메일함을 확인해줘 🙂");
    } catch (e: any) {
      setMsg(e?.message ?? "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setMsg(null);

    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? "로그아웃 실패");
        return;
      }

      // 로그아웃 후 페이지 새로고침(가장 안정적)
      window.location.href = "/owner";
    } catch (e: any) {
      setMsg(e?.message ?? "네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="owner 이메일 입력"
          type="email"
          autoComplete="email"
          style={{
            width: 260,
            padding: "8px 10px",
            border: "1px solid #ddd",
            borderRadius: 8,
            fontSize: 14,
          }}
          disabled={loading}
        />

        <button
          type="button"
          onClick={sendMagicLink}
          disabled={loading}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "전송중..." : "로그인 메일 보내기"}
        </button>

        <button
          type="button"
          onClick={logout}
          disabled={loading}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: "#fff",
            fontSize: 14,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          로그아웃
        </button>

        {msg && (
          <span style={{ fontSize: 13, color: "#666" }} aria-live="polite">
            {msg}
          </span>
        )}
      </div>

      <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
        • 메일에서 링크를 누르면 자동으로 로그인되고 /owner 로 돌아와야 해.
      </div>
    </div>
  );
}