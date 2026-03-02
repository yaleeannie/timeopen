"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function CallbackInner() {
  const router = useRouter();
  const sp = useSearchParams();

  useEffect(() => {
    const run = async () => {
      const code = sp.get("code");
      const next = sp.get("next") || "/owner";

      if (!code) {
        router.replace(next);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error("exchangeCodeForSession error:", error);
        router.replace(`/owner?auth=fail`);
        return;
      }

      router.replace(next);
    };

    void run();
  }, [router, sp]);

  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center">
      로그인 처리 중...
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white text-black flex items-center justify-center">
          로그인 처리 중...
        </main>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}