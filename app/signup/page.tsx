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
      setMsg("이메일/비밀번호를 입력해줘.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      // ✅ 회원가입: 이메일 확인 메일 발송됨(Confirm email 켜져있을 때)
      // 확인 링크가 열리면 /auth/callback에서 세션 교환 후 /owner로 이동
      const redirectTo = `${window.location.origin}/auth/callback?next=/owner`;

      const { error } = await supabase.auth.signUp({
        email: e,
        password: pw,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      setSent(true);
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
          처음 1회만 이메일 인증해요.
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
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>회원가입</div>

          {sent ? (
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", lineHeight: 1.6 }}>
              가입 확인 메일을 보냈어.
              <div style={{ marginTop: 8, fontSize: 13, color: "#555", fontWeight: 700 }}>
                메일에서 링크를 누르면 자동 로그인되고 <b>/owner</b>로 이동해.
              </div>

              <div style={{ marginTop: 14 }}>
                <a href="/login" style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}>
                  이미 계정 있어요 → 로그인
                </a>
              </div>
            </div>
          ) : (
            <>
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
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#b00020" }}>
                  {msg}
                </div>
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