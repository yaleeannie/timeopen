"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // ✅ /auth/callback에서 exchangeCodeForSession 하고 넘어오면
    // 여기서는 이미 세션이 있어야 함(없으면 링크 흐름이 잘못된 것)
    (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
    })().catch(() => setReady(false));
  }, []);

  async function onUpdate() {
    if (!pw || pw.length < 6) {
      setMsg("비밀번호는 6자 이상으로 입력해줘.");
      return;
    }
    if (pw !== pw2) {
      setMsg("비밀번호가 서로 달라.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.updateUser({
        password: pw,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      window.location.href = "/login";
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
          새 비밀번호를 설정해요.
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
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 12 }}>새 비밀번호 설정</div>

          {!ready ? (
            <div style={{ fontSize: 13, fontWeight: 800, color: "#b00020", lineHeight: 1.6 }}>
              세션이 없어요. 재설정 링크를 다시 요청해줘.
              <div style={{ marginTop: 10 }}>
                <a href="/forgot-password" style={{ textDecoration: "underline", fontWeight: 900, color: "#111" }}>
                  재설정 메일 다시 받기
                </a>
              </div>
            </div>
          ) : (
            <>
              <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                새 비밀번호
              </label>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="6자 이상"
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

              <label style={{ display: "block", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>
                새 비밀번호 확인
              </label>
              <input
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="한 번 더 입력"
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
                onClick={onUpdate}
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
                {loading ? "처리 중..." : "비밀번호 변경"}
              </button>

              {msg ? (
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: "#b00020" }}>
                  {msg}
                </div>
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