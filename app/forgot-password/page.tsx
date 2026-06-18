"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sent, setSent] = useState(false);

  async function onSend() {
    const e = email.trim().toLowerCase();
    if (!e) {
      setMsg("이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      // ✅ reset 링크가 열릴 페이지
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(e, {
        redirectTo,
      });

      if (error) {
        setMsg(error.message);
        return;
      }

      setSent(true);
    } catch {
      setMsg("네트워크 오류. 잠시 후 다시 시도해주세요.");
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
            <h1 className="mt-5 text-3xl font-black tracking-[-0.04em]">비밀번호 찾기</h1>
            <p className="mt-1 text-sm leading-5 text-gray-500">재설정 링크를 이메일로 보내드릴게요.</p>
          </header>

          {sent ? (
            <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-5 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#eafaf6] text-2xl font-black text-[#22a988]">✓</div>
              <div className="mt-4 text-lg font-black">재설정 메일을 보냈습니다</div>
              <div className="mt-2 text-sm font-medium leading-6 text-gray-500">
                메일에서 링크를 눌러 새 비밀번호를 설정해주세요.
              </div>
              
              <div className="mt-3 text-sm leading-6 text-gray-400">
                이메일이 도착하기까지 최대 5분 정도 걸릴 수 있어요.<br />
                스팸함/프로모션함도 꼭 확인해주세요.
              </div>

              <a href="/login" className="mt-5 flex min-h-11 w-full items-center justify-center rounded-xl bg-[#28b9dc] px-4 py-3 text-base font-black text-white">
                로그인으로 돌아가기
              </a>
            </section>
          ) : (
            <section className="rounded-[24px] border border-[#e5f3f6] bg-white p-4 shadow-sm">
              <div className="mb-4 text-lg font-black">이메일 확인</div>
              <label className="mb-1.5 block text-sm font-bold text-gray-700">이메일</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                inputMode="email"
                autoComplete="email"
                className="mb-4 min-h-11 w-full min-w-0 rounded-xl border border-[#dceef2] bg-white px-3 py-2.5 text-base outline-none focus:border-[#55d4f0]"
              />

              <button
                type="button"
                onClick={onSend}
                disabled={loading}
                className="min-h-11 w-full rounded-xl bg-[#28b9dc] px-4 py-3 text-base font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : "재설정 메일 보내기"}
              </button>

              {msg ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 [overflow-wrap:anywhere]">{msg}</div>
              ) : null}

              <a href="/login" className="mt-4 flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-[#28b9dc]">
                로그인으로 돌아가기
              </a>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
