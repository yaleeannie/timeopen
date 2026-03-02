"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

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

      // ✅ 가입 후 인증메일 클릭하면 여기로 돌아오게
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/owner`;

      const { error } = await supabase.auth.signUp({
        email: e,
        password: pw,
        options: { emailRedirectTo },
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("가입 메일을 보냈어! 메일에서 인증 링크를 누르면 /owner로 이동해.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>회원가입</h2>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        style={{ display: "block", width: 320, padding: 12, marginBottom: 10 }}
      />
      <input
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="비밀번호"
        type="password"
        style={{ display: "block", width: 320, padding: 12, marginBottom: 10 }}
      />

      <button onClick={onSignup} disabled={loading} style={{ padding: "10px 14px" }}>
        {loading ? "처리 중..." : "가입하기"}
      </button>

      {msg ? <div style={{ marginTop: 12 }}>{msg}</div> : null}
      <div style={{ marginTop: 14 }}>
        <a href="/login">이미 계정 있어요 → 로그인</a>
      </div>
    </main>
  );
}