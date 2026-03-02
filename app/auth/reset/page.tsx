"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthResetPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [ready, setReady] = useState(false);

  // reset 링크로 들어오면 Supabase가 세션을 붙여주는 경우가 많아서
  // 페이지 진입 시점에 "세션 존재"만 확인해두면 UX가 안정적입니다.
  useEffect(() => {
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        setReady(!!data.session);
      } catch {
        setReady(false);
      }
    })();
  }, []);

  async function onSetPassword() {
    if (!pw || pw.length < 6) {
      setMsg("비밀번호를 6자 이상으로 입력해주세요.");
      return;
    }
    if (pw !== pw2) {
      setMsg("비밀번호가 서로 다릅니다.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      // ✅ reset 링크로 들어온 상태(세션 있음)에서 비밀번호 갱신
      const { error } = await supabase.auth.updateUser({ password: pw });

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("비밀번호가 변경되었습니다. 이제 로그인해주세요.");
      // 원하시면 바로 /login으로 보내도 됩니다.
      setTimeout(() => {
        window.location.href = "/login";
      }, 700);
    } catch {
      setMsg("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
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
          새 비밀번호를 설정해주세요.
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

          {!ready ? (
            <div style={{ fontSize: 13, color: "#555", fontWeight: 700, lineHeight: 1.6 }}>
              재설정 링크가 만료되었거나 올바르지 않을 수 있습니다.
              <div style={{ marginTop: 8 }}>
                <a
                  href="/forgot-password"
                  style={{ textDecoration: "underline", fontWeight: 900, color: "#111" }}
                >
                  비밀번호 재설정 메일 다시 받기
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
                placeholder="새 비밀번호 (6자 이상)"
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
                placeholder="새 비밀번호 확인"
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
                onClick={onSetPassword}
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
                {loading ? "처리 중..." : "비밀번호 변경하기"}
              </button>

              {msg ? (
                <div style={{ marginTop: 12, fontSize: 13, fontWeight: 700, color: msg.includes("변경") ? "#111" : "#b00020" }}>
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