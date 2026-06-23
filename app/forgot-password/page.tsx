"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { validateEmail } from "@/features/auth/email";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sent, setSent] = useState(false);

  async function onSend() {
    const emailValidation = validateEmail(email);
    if (!emailValidation.ok) {
      setMsg(emailValidation.error);
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      // ✅ reset 링크가 열릴 페이지
      const redirectTo = `${window.location.origin}/auth/callback?next=/auth/reset`;

      const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.value, {
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
    <AuthShell
      title="비밀번호를 다시 설정해요"
      description="가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드려요."
    >
          {sent ? (
            <div className="text-center">
              <div className="brand-soft mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black">✓</div>
              <div className="mt-4 text-lg font-black">재설정 메일을 보냈습니다</div>
              <div className="mt-2 text-sm font-medium leading-6 text-gray-500">
                메일에서 링크를 눌러 새 비밀번호를 설정해주세요.
              </div>
              
              <div className="mt-3 text-sm leading-6 text-gray-400">
                이메일이 도착하기까지 최대 5분 정도 걸릴 수 있어요.<br />
                스팸함/프로모션함도 꼭 확인해주세요.
              </div>

              <a href="/login" className="brand-button mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-base font-black">
                로그인으로 돌아가기
              </a>
            </div>
          ) : (
            <>
              <label className="mb-1.5 block text-sm font-bold text-slate-700">이메일</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                inputMode="email"
                autoComplete="email"
                className="brand-input mb-5 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
              />
              <p className="-mt-3 mb-5 text-xs font-bold leading-5 text-slate-400">
                네이버·카카오·다음·Gmail·회사 이메일 모두 사용할 수 있어요.
              </p>

              <button
                type="button"
                onClick={onSend}
                disabled={loading}
                className="brand-button min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : "재설정 메일 보내기"}
              </button>

              {msg ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 [overflow-wrap:anywhere]">{msg}</div>
              ) : null}

              <a href="/login" className="brand-text mt-4 flex min-h-11 items-center justify-center rounded-xl text-sm font-bold">
                로그인으로 돌아가기
              </a>
            </>
          )}
    </AuthShell>
  );
}
