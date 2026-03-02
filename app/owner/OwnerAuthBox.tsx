"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const COOLDOWN_MS = 60_000; // 60초
const STORAGE_KEY = "timeopen_magiclink_last_sent_at";

export default function OwnerAuthBox() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  async function refreshMe() {
    try {
      const res = await fetch("/api/auth/me", { method: "GET" });
      const json = await res.json().catch(() => ({}));
      setUserEmail(json?.user?.email ?? null);
    } catch {
      setUserEmail(null);
    }
  }

  useEffect(() => {
    refreshMe();

    const tick = () => {
      const last = Number(localStorage.getItem(STORAGE_KEY) ?? "0");
      setCooldownLeft(Math.max(0, COOLDOWN_MS - (Date.now() - last)));
    };

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, []);

  const canSend = useMemo(() => !sending && cooldownLeft === 0, [sending, cooldownLeft]);

  async function sendMagicLink() {
    const e = email.trim().toLowerCase();
    if (!e) {
      setMsg("이메일을 입력해줘.");
      return;
    }
    if (!canSend) return;

    setSending(true);
    setMsg("");

    try {
      // 1) 서버에서 OWNER_EMAILS gate 통과
      const gate = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });
      const gateJson = await gate.json().catch(() => ({}));
      if (!gate.ok) {
        setMsg(gateJson?.error ?? "메일 전송 실패");
        return;
      }

      // 2) 실제 발송은 브라우저 supabase로 (PKCE 안정)
      const supabase = createSupabaseBrowserClient();

      // ✅ 배포 URL 고정 (흔들림 제거)
      const redirectTo = "https://timeopen.vercel.app/auth/callback?next=/owner";

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setMsg("메일 보냈어! 메일함에서 링크를 누르면 자동으로 로그인돼.");
    } catch {
      setMsg("네트워크 오류. 잠시 후 다시 시도해줘.");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    setMsg("");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    await refreshMe();
    setMsg("로그아웃 완료");
  }

  return (
    <div
      style={{
        marginTop: 16,
        padding: 14,
        border: "1px solid #e5e5e5",
        borderRadius: 12,
        background: "#fff",
        color: "#111",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#111" }}>
        owner 기능은 로그인 후 사용 가능해요.
      </div>

      {userEmail ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
            로그인됨: <span style={{ fontWeight: 800 }}>{userEmail}</span>
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            로그아웃
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="owner 이메일 입력"
            style={{
              minWidth: 260,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #cfcfcf",
              background: "#fff",
              color: "#111",
            }}
          />
          <button
            type="button"
            onClick={sendMagicLink}
            disabled={!canSend}
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              opacity: canSend ? 1 : 0.55,
              cursor: canSend ? "pointer" : "not-allowed",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {sending
              ? "보내는 중..."
              : cooldownLeft > 0
              ? `잠시만 (${Math.ceil(cooldownLeft / 1000)}s)`
              : "로그인 메일 보내기"}
          </button>
        </div>
      )}

      {msg ? <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: "#111" }}>{msg}</div> : null}
    </div>
  );
}