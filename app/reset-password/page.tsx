"use client";

import { useEffect, useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        const hasSession = Boolean(data.session);
        setHasRecoverySession(hasSession);

        if (!hasSession) {
          setMessage("비밀번호 재설정 링크가 만료되었거나 유효하지 않아요. 다시 요청해주세요.");
        }
      } catch {
        if (!mounted) return;
        setHasRecoverySession(false);
        setMessage("비밀번호 재설정 링크가 만료되었거나 유효하지 않아요. 다시 요청해주세요.");
      } finally {
        if (mounted) setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function onUpdatePassword() {
    if (loading) return;

    if (!password || password.length < 8) {
      setMessage("비밀번호를 8자 이상으로 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setMessage("비밀번호가 서로 다릅니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setMessage("비밀번호를 변경하지 못했어요. 재설정 링크를 다시 요청해주세요.");
        return;
      }

      await supabase.auth.signOut();
      setSuccess(true);
      setHasRecoverySession(false);
      setMessage("비밀번호가 변경되었어요. 새 비밀번호로 로그인해주세요.");
    } catch {
      setMessage("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="새 비밀번호를 설정해요"
      description="앞으로 사용할 안전한 비밀번호를 입력해주세요."
    >
      {checkingSession ? (
        <div className="text-center text-sm font-bold leading-6 text-gray-500">
          재설정 링크를 확인 중입니다...
        </div>
      ) : success ? (
        <div className="text-center">
          <div className="brand-soft mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black">
            ✓
          </div>
          <div className="mt-4 text-base font-black text-slate-900">
            비밀번호가 변경되었어요.
          </div>
          <div className="mt-2 text-sm font-medium leading-6 text-gray-500">
            새 비밀번호로 다시 로그인해주세요.
          </div>
          <a
            href="/login"
            className="brand-button mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl px-4 py-3 text-base font-black"
          >
            로그인하기
          </a>
        </div>
      ) : !hasRecoverySession ? (
        <div className="text-center">
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
            {message || "비밀번호 재설정 링크가 만료되었거나 유효하지 않아요. 다시 요청해주세요."}
          </div>
          <a
            href="/forgot-password"
            className="brand-outline mt-4 flex min-h-11 items-center justify-center rounded-xl px-4 py-3 text-sm font-black"
          >
            재설정 메일 다시 받기
          </a>
          <a
            href="/login"
            className="brand-text mt-3 flex min-h-11 items-center justify-center rounded-xl text-sm font-bold"
          >
            로그인으로 돌아가기
          </a>
        </div>
      ) : (
        <>
          <label className="mb-1.5 block text-sm font-bold text-slate-700">새 비밀번호</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="새 비밀번호 (8자 이상)"
            type="password"
            autoComplete="new-password"
            className="brand-input mb-4 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
          />

          <label className="mb-1.5 block text-sm font-bold text-slate-700">새 비밀번호 확인</label>
          <input
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="새 비밀번호 확인"
            type="password"
            autoComplete="new-password"
            className="brand-input mb-5 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
          />

          <button
            type="button"
            onClick={onUpdatePassword}
            disabled={loading}
            className="brand-button min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "변경 중..." : "비밀번호 변경하기"}
          </button>

          {message ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 [overflow-wrap:anywhere]">
              {message}
            </div>
          ) : null}
        </>
      )}
    </AuthShell>
  );
}
