"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sent, setSent] = useState(false);

  async function onSignup() {
  const e = email.trim().toLowerCase();
  if (!e || !pw) {
    setMsg("이메일/비밀번호를 입력해 주세요.");
    return;
  }

  setLoading(true);
  setMsg("");

  try {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/owner`;

    const { error } = await supabase.auth.signUp({
      email: e,
      password: pw,
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      const m = (error.message || "").toLowerCase();

      // ✅ 이미 가입된 이메일 케이스(표현이 조금씩 다를 수 있어서 넓게 잡음)
      if (
        m.includes("already") ||
        m.includes("registered") ||
        m.includes("user already") ||
        m.includes("exists")
      ) {
        setMsg("이미 가입된 이메일입니다. 로그인하거나 비밀번호 재설정을 진행해 주세요.");
        setSent(true); // 아래 안내 UI 재사용
        return;
      }

      setMsg(error.message);
      return;
    }

    setSent(true);
  } catch {
    setMsg("네트워크 오류입니다. 잠시 후 다시 시도해 주세요.");
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
            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">TimeOpen</h1>
            <p className="mt-1 text-sm text-gray-500">처음 한 번만 이메일을 인증해주세요.</p>
          </header>

          <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
            <div className="mb-4 text-lg font-black">회원가입</div>

          {sent ? (
            <div className="text-sm font-bold leading-6 text-gray-900">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eafaf6] text-2xl font-black text-[#22a988]">✓</div>
              <div className="text-center text-base font-black">가입 확인 메일을 보냈습니다.</div>
              <div className="mt-2 text-center text-sm font-medium leading-6 text-gray-500">
                메일이 안 오면 이미 가입된 이메일일 수 있어요. 아래에서 로그인하거나 비밀번호 재설정을 해주세요.
              </div>

              {msg ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">{msg}</div>
              ) : null}

              <div className="mt-5 grid gap-2 text-center text-sm">
                <a href="/login" className="min-h-11 rounded-xl bg-[#28b9dc] px-3 py-3 font-black text-white">
                  로그인
                </a>
                <a
                  href="/forgot-password"
                  className="min-h-11 rounded-xl border border-[#dceef2] px-3 py-3 font-bold text-[#5594a3]"
                >
                  비밀번호 재설정
                </a>
              </div>
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">이메일</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                inputMode="email"
                autoComplete="email"
                className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
              />

              <label className="mb-1.5 block text-sm font-bold text-gray-700">
                비밀번호
              </label>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="비밀번호"
                type="password"
                autoComplete="new-password"
                className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
              />

              <button
                type="button"
                onClick={onSignup}
                disabled={loading}
                className="min-h-11 w-full rounded-xl bg-[#28b9dc] px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-[#20afd2] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : "가입하기"}
              </button>

              {msg ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">{msg}</div>
              ) : null}

              <div className="mt-5 text-center text-sm">
                <a href="/login" className="flex min-h-11 items-center justify-center rounded-xl border border-[#dceef2] px-3 py-3 font-bold text-[#5594a3]">
                  이미 계정 있어요 → 로그인
                </a>
              </div>
            </>
          )}
          </section>
        </div>
      </div>
    </main>
  );
}
