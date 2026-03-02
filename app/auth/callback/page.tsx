"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const sp = useSearchParams();
  const [msg, setMsg] = useState("로그인 처리 중...");

  useEffect(() => {
    (async () => {
      const code = sp.get("code");
      const next = sp.get("next") ?? "/owner";

      if (!code) {
        // code가 없으면 그냥 이동
        window.location.replace(next);
        return;
      }

      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        // 실패 이유를 owner에 보여주기
        window.location.replace(
          `/owner?auth=fail&reason=${encodeURIComponent(error.message)}`
        );
        return;
      }

      window.location.replace(next);
    })().catch(() => {
      setMsg("로그인 처리 중 오류가 발생했어요. 다시 시도해 주세요.");
    });
  }, [sp]);

  return (
    <div style={{ padding: 20, color: "#111", background: "#fff" }}>
      <div style={{ fontSize: 14, fontWeight: 800 }}>{msg}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
        창을 닫지 말고 잠시만 기다려 주세요.
      </div>
    </div>
  );
}