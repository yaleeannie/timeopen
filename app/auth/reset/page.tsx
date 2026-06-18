"use client";

import { useEffect, useState } from "react";
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
    <main className="flex min-h-screen overflow-x-hidden bg-[#eef6f8] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto flex w-full min-w-0 max-w-lg items-center">
        <div className="w-full rounded-[28px] bg-[#fbfdfe] px-4 pb-7 pt-8 shadow-[0_20px_60px_rgba(80,145,164,0.14)] sm:rounded-[36px] sm:px-6 sm:pb-9 sm:pt-10">
          <header className="mb-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-[#5bd8f2] to-[#24b8df] text-2xl font-black text-white shadow-[0_12px_26px_rgba(40,185,220,0.22)]">T</div>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">새 비밀번호</h1>
            <p className="mt-1 text-sm text-gray-500">안전한 새 비밀번호를 설정해주세요.</p>
          </header>

          {!ready ? (
            <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-5 text-center shadow-sm">
              <div className="text-sm font-bold leading-6 text-gray-500">
              {msg || "재설정 링크를 확인 중입니다..."}
              </div>
              <div className="mt-4">
                <a href="/forgot-password" className="flex min-h-11 items-center justify-center rounded-xl bg-[#eef9fb] px-4 py-3 text-sm font-black text-[#287f94]">
                  비밀번호 재설정 메일 다시 받기
                </a>
              </div>
            </section>
          ) : (
            <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
              <div className="mb-4 text-lg font-black">비밀번호 재설정</div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">새 비밀번호</label>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="새 비밀번호 (6자 이상)"
                type="password"
                autoComplete="new-password"
                className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
              />

              <label className="mb-1.5 block text-sm font-bold text-gray-700">새 비밀번호 확인</label>
              <input
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="새 비밀번호 확인"
                type="password"
                autoComplete="new-password"
                className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
              />

              <button
                type="button"
                onClick={onSetPassword}
                disabled={loading}
                className="min-h-11 w-full rounded-xl bg-[#28b9dc] px-4 py-3 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : "비밀번호 변경하기"}
              </button>

              {msg ? (
                <div className={`mt-4 rounded-xl px-4 py-3 text-sm font-bold [overflow-wrap:anywhere] ${
                  msg.includes("변경")
                    ? "bg-[#eef9fb] text-[#287f94]"
                    : "border border-red-100 bg-red-50 text-red-700"
                }`}>
                  {msg}
                </div>
              ) : null}

              <div className="mt-4 text-center">
                <a href="/login" className="inline-flex min-h-11 items-center px-3 text-sm font-bold text-[#28b9dc]">
                  로그인으로 돌아가기
                </a>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
