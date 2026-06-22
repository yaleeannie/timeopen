"use client";

import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthResetPage() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createSupabaseBrowserClient();

        // 1) reset 링크로 들어오면 보통 code 파라미터가 있음
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // 2) code -> session 교환 (이 과정을 해야 세션이 붙는 경우가 많음)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setReady(false);
            setMsg("재설정 링크가 만료되었거나 올바르지 않습니다. 다시 요청해주세요.");
            return;
          }
        }

        // 3) 세션 확인
        const { data } = await supabase.auth.getSession();
        setReady(!!data.session);

        if (!data.session && !msg) {
          setMsg("재설정 링크가 만료되었거나 올바르지 않습니다. 다시 요청해주세요.");
        }
      } catch {
        setReady(false);
        setMsg("재설정 링크 처리 중 오류가 발생했습니다. 다시 요청해주세요.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSetPassword() {
    if (!pw || pw.length < 6) {
      setMsg("비밀번호를 6자 이상으로 입력해주세요.");
      return;
    }
    if (pw !== pw2) {
      setMsg("비밀번호가 서로 다릅니다.");
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

      setMsg("비밀번호가 변경되었습니다. 이제 로그인해주세요.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 700);
    } catch {
      setMsg("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="새 비밀번호를 설정해요"
      description="앞으로 사용할 안전한 비밀번호를 입력해주세요."
    >
          {!ready ? (
            <div className="text-center">
              <div className="text-sm font-bold leading-6 text-gray-500">
              {msg || "재설정 링크를 확인 중입니다..."}
              </div>
              <div className="mt-4">
                <a href="/forgot-password" className="brand-outline flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-black">
                  비밀번호 재설정 메일 다시 받기
                </a>
              </div>
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">새 비밀번호</label>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                type="password"
                autoComplete="new-password"
                className="brand-input mb-4 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
              />

              <label className="mb-1.5 block text-sm font-bold text-slate-700">새 비밀번호 확인</label>
              <input
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="새 비밀번호 확인"
                type="password"
                autoComplete="new-password"
                className="brand-input mb-5 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
              />

              <button
                type="button"
                onClick={onSetPassword}
                disabled={loading}
                className="brand-button min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : "비밀번호 변경하기"}
              </button>

              {msg ? (
                <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold [overflow-wrap:anywhere] ${
                  msg.includes("변경")
                    ? "brand-chip"
                    : "border border-red-100 bg-red-50 text-red-700"
                }`}>
                  {msg}
                </div>
              ) : null}

              <div className="mt-4 text-center">
                <a href="/login" className="brand-text inline-flex min-h-11 items-center px-3 text-sm font-bold">
                  로그인으로 돌아가기
                </a>
              </div>
            </>
          )}
    </AuthShell>
  );
}
