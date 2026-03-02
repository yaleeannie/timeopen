"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function CallbackClient({
  code,
  nextPath,
}: {
  code: string | null;
  nextPath: string;
}) {
  const [msg, setMsg] = useState("로그인 처리 중...");

  useEffect(() => {
    (async () => {
      if (!code) {
        window.location.replace(nextPath);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        window.location.replace(
          `/owner?auth=fail&reason=${encodeURIComponent(error.message)}`
        );
        return;
      }

      window.location.replace(nextPath);
    })().catch(() => {
      setMsg("로그인 처리 중 오류가 발생했어요. 다시 시도해 주세요.");
    });
  }, [code, nextPath]);

  return (
    <div style={{ padding: 20, color: "#111", background: "#fff" }}>
      <div style={{ fontSize: 14, fontWeight: 800 }}>{msg}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        창을 닫지 말고 잠시만 기다려 주세요.
      </div>
    </div>
  );
}