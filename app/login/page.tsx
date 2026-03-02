"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    const e = email.trim().toLowerCase();
    if (!e || !pw) {
      setMsg("이메일/비밀번호를 입력해줘.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password: pw,
      });

      if (error) {
        // 흔한 케이스들 UX 개선
        const m = (error.message || "").toLowerCase();

        if (m.includes("invalid login credentials")) {
          setMsg("이메일 또는 비밀번호가 맞지 않아요. 비밀번호를 잊었으면 재설정을 눌러줘.");
        } else if (m.includes("email not confirmed")) {
          setMsg("이메일 인증이 아직 안 됐어요. 메일함에서 인증 링크를 먼저 눌러줘.");
        } else {
          setMsg(error.message);
        }
        return;
      }

      window.location.href = "/owner";
    } catch {
      setMsg("네트워크 오류. 잠시 후 다시 시도해줘.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>TimeOpen</div>
        <div style={{ fontSize: 14, color: "#555", marginBottom: 18 }}>
          판매자 로그인
        </div>

        <div
          style={{
            border: "1px solid #e6e6e6",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>로그인</div>

          <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
            이메일
          </label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            inputMode="email"
            autoComplete="email"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #d0d0d0",
              background: "#fff",
              color: "#111",
              outline: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          />

          <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
            비밀번호
          </label>
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            type="password"
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #d0d0d0",
              background: "#fff",
              color: "#111",
              outline: "none",
              fontSize: 14,
              marginBottom: 12,
            }}
          />

          <button
            type="button"
            onClick={onLogin}
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 12px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              fontWeight: 900,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "처리 중..." : "로그인"}
          </button>

          {msg ? (
            <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#b00020" }}>
              {msg}
            </div>
          ) : null}

          <div style={{ marginTop: 14, fontSize: 13, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/forgot-password" style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}>
              비밀번호를 잊었어요
            </a>
            <a href="/signup" style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}>
              처음이에요 → 회원가입
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}