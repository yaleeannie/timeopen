"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isBootstrapApiSuccess } from "@/features/onboarding/bootstrapResponse";

export default function OnboardingBootstrapRetry() {
  const router = useRouter();
  const attemptedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const runBootstrap = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    try {
      const response = await fetch("/api/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "onboarding-retry" }),
      });
      const json = await response.json().catch(() => ({}));

      if (!response.ok || !isBootstrapApiSuccess(json)) {
        throw new Error("bootstrap failed");
      }

      router.refresh();
    } catch {
      setFailed(true);
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;
    void runBootstrap();
  }, [runBootstrap]);

  return (
    <main className="soft-page-bg flex items-center px-4 py-8 text-slate-950">
      <div className="glass-card mx-auto w-full max-w-md rounded-[28px] p-6 text-center">
        <div className="brand-gradient mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black text-white">
          T
        </div>
        <h1 className="mt-5 text-2xl font-black tracking-[-0.04em]">
          초기 설정을 불러오고 있어요.
        </h1>
        <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
          처음 로그인한 계정이라 샵 정보를 준비하고 있어요. 잠시만 기다려 주세요.
        </p>
        {failed ? (
          <p className="mt-4 rounded-2xl bg-[#fff5e6] px-4 py-3 text-sm font-bold leading-5 text-[#b7781f]">
            초기 설정을 불러오지 못했어요. 다시 시도해 주세요.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void runBootstrap()}
          disabled={loading}
          className="brand-button mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl px-5 text-sm font-black disabled:cursor-wait disabled:opacity-70"
        >
          {loading ? "준비 중..." : "다시 시도"}
        </button>
        <a
          href="/login"
          className="brand-text mt-2 flex min-h-11 w-full items-center justify-center rounded-xl text-sm font-bold"
        >
          로그인으로 돌아가기
        </a>
      </div>
    </main>
  );
}
