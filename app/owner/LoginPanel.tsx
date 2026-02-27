"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function LoginPanel() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    const v = email.trim();
    if (!v) {
      setMsg("이메일을 입력해줘!");
      return;
    }

    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: v,
      options: {
        emailRedirectTo: `${window.location.origin}/owner`,
      },
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("메일함에서 로그인 링크를 눌러줘!");
  }

  async function onLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    window.location.reload();
  }

  return (
    <div style={{ marginTop: 14, padding: 12, border: "1px solid #eee", borderRadius: 10, maxWidth: 420 }}>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
        owner 기능은 로그인 후 사용 가능해요.
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@example.com"
          style={{
            flex: 1,
            height: 36,
            padding: "0 10px",
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        />
        <button
          type="button"
          onClick={onLogin}
          disabled={loading}
          style={{ height: 36, padding: "0 12px", borderRadius: 8 }}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={onLogout}
          disabled={loading}
          style={{ height: 36, padding: "0 12px", borderRadius: 8 }}
        >
          로그아웃
        </button>
      </div>

      {msg ? <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>{msg}</div> : null}
    </div>
  );
}