"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sent, setSent] = useState(false);

  async function onSend() {
    const e = email.trim().toLowerCase();
    if (!e) {
      setMsg("이메일을 입력해줘.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      // ✅ reset 링크가 열릴 페이지 (다음 단계에서 /auth/reset 만들 예정)
      const redirectTo = `${window.location.origin}/auth/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo,
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
          비밀번호 재설정 메일을 보내드릴게요.
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
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>비밀번호 재설정</div>

          {sent ? (
            <div style={{ fontSize: 14, fontWeight: 800, color: "#111", lineHeight: 1.6 }}>
              재설정 메일을 보냈습니다.
              <div style={{ marginTop: 8, fontSize: 13, color: "#555", fontWeight: 700 }}>
                메일에서 링크를 눌러 새 비밀번호를 설정해줘.
              </div>

              <div style={{ marginTop: 14 }}>
                <a href="/login" style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}>
                  로그인으로 돌아가기
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

              <button
                type="button"
                onClick={onSend}
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
                {loading ? "처리 중..." : "재설정 메일 보내기"}
              </button>

              {msg ? (
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#b00020" }}>{msg}</div>
              ) : null}

              <div style={{ marginTop: 14, fontSize: 13 }}>
                <a href="/login" style={{ textDecoration: "underline", fontWeight: 800, color: "#111" }}>
                  로그인으로 돌아가기
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}