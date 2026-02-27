"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const signIn = async () => {
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/owner`,
      },
    });
    setSent(true);
  };

  if (sent) {
    return <div style={{ padding: 40 }}>이메일 확인해서 로그인 링크 눌러줘!</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Owner Login</h1>
      <input
        placeholder="이메일 입력"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ border: "1px solid #ccc", padding: 8 }}
      />
      <button onClick={signIn} style={{ marginLeft: 8 }}>
        로그인 링크 보내기
      </button>
    </div>
  );
}