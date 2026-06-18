"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    const e = email.trim().toLowerCase();
    if (!e || !pw) {
      setMsg("이메일/비밀번호를 입력해줘.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: e,
        password: pw,
      });

      if (error) {
        // 흔한 케이스들 UX 개선
        const m = (error.message || "").toLowerCase();

        if (m.includes("invalid login credentials")) {
          setMsg("이메일 또는 비밀번호가 맞지 않아요. 비밀번호를 잊었으면 재설정을 눌러줘.");
        } else if (m.includes("email not confirmed")) {
          setMsg("이메일 인증이 아직 안 됐어요. 메일함에서 인증 링크를 먼저 눌러줘.");
        } else {
          setMsg(error.message);
        }
        return;
      }

      window.location.href = "/owner";
    } catch {
      setMsg("네트워크 오류. 잠시 후 다시 시도해줘.");
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
            <p className="mt-1 text-sm text-gray-500">사장님 계정으로 로그인하세요.</p>
          </header>

          <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
            <div className="mb-4 text-lg font-black">로그인</div>

          <label className="mb-1.5 block text-sm font-bold text-gray-700">이메일</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            inputMode="email"
            autoComplete="email"
            className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
          />

          <label className="mb-1.5 block text-sm font-bold text-gray-700">비밀번호</label>
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            type="password"
            autoComplete="current-password"
            className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
          />

          <button
            type="button"
            onClick={onLogin}
            disabled={loading}
            className="min-h-11 w-full rounded-xl bg-[#28b9dc] px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-[#20afd2] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "처리 중..." : "로그인"}
          </button>

          {msg ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">
              {msg}
            </div>
          ) : null}

          <div className="mt-5 grid gap-2 text-center text-sm">
            <a href="/forgot-password" className="min-h-11 rounded-xl px-3 py-3 font-bold text-[#28b9dc]">
              비밀번호를 잊었어요
            </a>
            <a href="/signup" className="min-h-11 rounded-xl border border-[#dceef2] px-3 py-3 font-bold text-[#5594a3]">
              처음이에요 → 회원가입
            </a>
          </div>
          </section>
        </div>
      </div>
    </main>
  );
}
