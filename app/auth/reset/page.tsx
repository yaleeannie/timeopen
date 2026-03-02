"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase가 reset 링크로 들어오면 세션/상태가 잡혀야 함
    setReady(true);
  }, []);

  async function onUpdate() {
    if (!pw) {
      setMsg("새 비밀번호를 입력해줘.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: pw });

      if (error) {
        setMsg(error.message);
        return;
      }

      setMsg("비밀번호 변경 완료! 이제 로그인해줘.");
      setTimeout(() => (window.location.href = "/login"), 700);
    } finally {
      setLoading(false);
    }
  }

  if (!ready) return null;

  return (
    <main style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>새 비밀번호 설정</h2>

      <input
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="새 비밀번호"
        type="password"
        style={{ display: "block", width: 320, padding: 12, marginBottom: 10 }}
      />

      <button onClick={onUpdate} disabled={loading} style={{ padding: "10px 14px" }}>
        {loading ? "처리 중..." : "비밀번호 변경"}
      </button>

      {msg ? <div style={{ marginTop: 12 }}>{msg}</div> : null}
    </main>
  );
}