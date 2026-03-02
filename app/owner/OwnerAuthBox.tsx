"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const COOLDOWN_MS = 60_000;
const STORAGE_KEY = "timeopen_magiclink_last_sent_at";

export default function OwnerAuthBox() {
  const [email, setEmail] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const [cooldownLeft, setCooldownLeft] = useState(0);

  async function refreshMe() {
    const res = await fetch("/api/auth/me");
    const json = await res.json().catch(() => ({}));
    setUserEmail(json?.user?.email ?? null);
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
    if (!e) return setMsg("이메일을 입력해줘.");
    if (!canSend) return;

    setSending(true);
    setMsg("");

    try {
      // 1️⃣ owner 허용 여부만 서버에서 검사
      const gate = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: e }),
      });

      const gateJson = await gate.json().catch(() => ({}));
      if (!gate.ok) {
        setMsg(gateJson?.error ?? "허용되지 않은 이메일");
        return;
      }

      // 2️⃣ 실제 로그인 시작은 반드시 브라우저에서
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/owner`,
        },
      });

      if (error) return setMsg(error.message);

      localStorage.setItem(STORAGE_KEY, String(Date.now()));
      setMsg("메일을 보냈어! 메일에서 링크를 눌러줘.");
    } catch {
      setMsg("네트워크 오류");
    } finally {
      setSending(false);
    }
  }

  async function logout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refreshMe();
  }

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", borderRadius: 12 }}>
      {userEmail ? (
        <>
          <div>로그인됨: {userEmail}</div>
          <button onClick={logout}>로그아웃</button>
        </>
      ) : (
        <>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={sendMagicLink}>로그인 메일 보내기</button>
        </>
      )}
      <div>{msg}</div>
    </div>
  );
}