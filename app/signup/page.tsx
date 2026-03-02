"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sent, setSent] = useState(false);

  async function onSignup() {
  const e = email.trim().toLowerCase();
  if (!e || !pw) {
    setMsg("이메일/비밀번호를 입력해 주세요.");
    return;
  }

  setLoading(true);
  setMsg("");

  try {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/owner`;

    const { error } = await supabase.auth.signUp({
      email: e,
      password: pw,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      const m = (error.message || "").toLowerCase();

      // ✅ 이미 가입된 이메일 케이스(표현이 조금씩 다를 수 있어서 넓게 잡음)
      if (
        m.includes("already") ||
        m.includes("registered") ||
        m.includes("user already") ||
        m.includes("exists")
      ) {
        setMsg("이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 진행해 주세요.");
        setSent(true); // 아래 안내 UI 재사용
        return;
      }

      setMsg(error.message);
      return;
    }

    setSent(true);
  } catch {
    setMsg("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
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
        <div style={{ fontSize: 14, color: "#555", marginBottom: 18 }}>처음 1회만 이메일 인증해요.</div>

        <div
          style={{
            border: "1px solid #e6e6e6",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
            background: "#fff",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>회원가입</div>

          {sent ? (
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", lineHeight: 1.6 }}>
              가입 확인 메일을 보냈습니다.
              <div style={{ marginTop: 8, fontSize: 13, color: "#555", fontWeight: 700 }}>
                메일이 안 오면 이미 가입된 이메일일 수 있어요. 아래에서 로그인하거나 비밀번호 재설정을 해주세요.
              </div>

              {msg ? (
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#b00020" }}>{msg}</div>
              ) : null}

              <div style={{ marginTop: 14, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="/login" style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}>
                  로그인
                </a>
                <a
                  href="/forgot-password"
                  style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}
                >
                  비밀번호 재설정
                </a>
              </div>
            </div>
          ) : (
            <>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>이메일</label>
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
                autoComplete="new-password"
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
                onClick={onSignup}
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
                {loading ? "처리 중..." : "가입하기"}
              </button>

              {msg ? (
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#b00020" }}>{msg}</div>
              ) : null}

              <div style={{ marginTop: 14, fontSize: 13 }}>
                <a href="/login" style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}>
                  이미 계정 있어요 → 로그인
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}