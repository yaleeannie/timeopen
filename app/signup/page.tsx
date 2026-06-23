"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sent, setSent] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  async function onSignup() {
  const e = email.trim().toLowerCase();
  if (!e || !pw) {
    setMsg("이메일/비밀번호를 입력해 주세요.");
    return;
  }

  setLoading(true);
  setMsg("");
  setAlreadyRegistered(false);

  try {
    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    callbackUrl.searchParams.set("next", "/onboarding");
    callbackUrl.searchParams.set("flow", "signup");

    const { data, error } = await supabase.auth.signUp({
      email: e,
      password: pw,
      options: { emailRedirectTo: callbackUrl.toString() },
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
        setAlreadyRegistered(true);
        setMsg("이미 가입된 이메일이에요. 로그인해 주세요.");
        setSent(true);
        return;
      }

      setMsg(error.message);
      return;
    }

    // Supabase 설정에 따라 기존 가입자는 오류 대신 identities가 빈 사용자로 반환될 수 있습니다.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setAlreadyRegistered(true);
      setMsg("이미 가입된 이메일이에요. 로그인해 주세요.");
      setSent(true);
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
    <AuthShell
      title="인스타 예약 링크를 만들고 시작해보세요"
      description="이메일 인증 후 샵 정보, 메뉴판, 영업시간을 차례로 설정할 수 있어요."
    >
          {sent ? (
            <div className="text-sm font-bold leading-6 text-gray-900">
              <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-black ${
                alreadyRegistered
                  ? "bg-[#fff5e6] text-[#b7781f]"
                  : "brand-soft"
              }`}>
                {alreadyRegistered ? "!" : "✓"}
              </div>
              <div className="text-center text-base font-black">
                {alreadyRegistered ? "이미 가입된 이메일이에요." : "가입 확인 메일을 보냈습니다."}
              </div>
              <div className="mt-2 text-center text-sm font-medium leading-6 text-gray-500">
                {alreadyRegistered
                  ? "기존 계정으로 로그인하거나 비밀번호를 재설정해 주세요."
                  : "메일에서 확인 링크를 누르면 로그인 과정 없이 온보딩으로 이동합니다."}
              </div>

              {msg ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">{msg}</div>
              ) : null}

              <div className="mt-5 grid gap-2 text-center text-sm">
                <a href="/login" className="brand-button min-h-11 rounded-xl px-3 py-3 font-black">
                  로그인
                </a>
                <a
                  href="/forgot-password"
                  className="brand-outline min-h-11 rounded-xl px-3 py-3 font-bold"
                >
                  비밀번호 재설정
                </a>
              </div>
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
                className="brand-input mb-4 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
              />

              <label className="mb-1.5 block text-sm font-bold text-slate-700">
                비밀번호
              </label>
              <input
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="비밀번호"
                type="password"
                autoComplete="new-password"
                className="brand-input mb-5 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
              />

              <button
                type="button"
                onClick={onSignup}
                disabled={loading}
                className="brand-button min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "처리 중..." : "가입하기"}
              </button>

              {msg ? (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">{msg}</div>
              ) : null}

              <div className="mt-5 text-center text-sm">
                <a href="/login" className="brand-outline flex min-h-11 items-center justify-center rounded-xl px-3 py-3 font-bold">
                  이미 계정 있어요 → 로그인
                </a>
              </div>
            </>
          )}
    </AuthShell>
  );
}
