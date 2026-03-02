"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const COOLDOWN_MS = 60_000; // 60초
const STORAGE_KEY = "timeopen_magiclink_last_sent_at";

export default function OwnerAuthBox() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string>("");

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
      const left = Math.max(0, COOLDOWN_MS - (Date.now() - last));
      setCooldownLeft(left);
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
      const supabase = createSupabaseBrowserClient();

      // ⭐️ PKCE 쿠키 저장을 위해 "브라우저에서" 시작해야 함
      const redirectTo = `${window.location.origin}/auth/callback?next=/owner`;

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

      // ✅ UX 안정성: 상태 동기화 한 번
      await refreshMe();
    } catch {
      setMsg("네트워크 오류. 잠시 후 다시 시도해줘.");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    setMsg("");
    try {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut(); // ✅ 브라우저 로그인 흐름과 통일
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
        background: "#ffffff",
        color: "#111111",
      }}
    >
      <div style={{ fontSize: 13, color: "#111", marginBottom: 10, fontWeight: 600 }}>
        owner 기능은 로그인 후 사용 가능해요.
      </div>

      {userEmail ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ fontSize: 14, color: "#111", fontWeight: 600 }}>
            로그인됨: <span style={{ fontWeight: 800 }}>{userEmail}</span>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              fontSize: 13,
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
              fontSize: 14,
              background: "#fff",
              color: "#111",
              outline: "none",
            }}
          />

          <button
            type="button"
            onClick={sendMagicLink}
            disabled={!canSend}
            style={{
              fontSize: 13,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #111",
              background: "#111",
              color: "#fff",
              opacity: canSend ? 1 : 0.55,
              cursor: canSend ? "pointer" : "not-allowed",
              whiteSpace: "nowrap",
              fontWeight: 800,
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

      {msg ? (
        <div style={{ marginTop: 10, fontSize: 13, color: "#111", fontWeight: 600 }}>
          {msg}
        </div>
      ) : null}

      {!userEmail ? (
        <div style={{ marginTop: 10, fontSize: 12, color: "#111" }}>
          • 메일에서 링크를 누르면 자동으로 로그인되고{" "}
          <code style={{ color: "#111" }}>/owner</code>로 돌아와야 해.
        </div>
      ) : null}
    </div>
  );
}