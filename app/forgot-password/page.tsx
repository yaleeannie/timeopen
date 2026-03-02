"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

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
      const redirectTo = `${window.location.origin}/auth/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("재설정 메일을 보냈어! 메일에서 링크를 눌러줘.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>비밀번호 재설정</h2>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        style={{ display: "block", width: 320, padding: 12, marginBottom: 10 }}
      />

      <button onClick={onSend} disabled={loading} style={{ padding: "10px 14px" }}>
        {loading ? "보내는 중..." : "재설정 메일 보내기"}
      </button>

      {msg ? <div style={{ marginTop: 12 }}>{msg}</div> : null}

      <div style={{ marginTop: 14 }}>
        <a href="/login">로그인으로 돌아가기</a>
      </div>
    </main>
  );
}