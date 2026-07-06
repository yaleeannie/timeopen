"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { validateEmail } from "@/features/auth/email";
import { buildOwnerLegalConsentMetadata } from "@/features/legal/consent";
import { getSiteUrl } from "@/lib/siteUrl";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [sent, setSent] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const requiredConsentsAgreed = termsAgreed && privacyAgreed;
  const allConsentsAgreed = termsAgreed && privacyAgreed && marketingAgreed;

  function setAllConsents(next: boolean) {
    setTermsAgreed(next);
    setPrivacyAgreed(next);
    setMarketingAgreed(next);
  }

  async function onSignup() {
  if (loading) return;

  if (!requiredConsentsAgreed) {
    setMsg("필수 약관과 개인정보 수집·이용에 동의해 주세요.");
    return;
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.ok) {
    setMsg(emailValidation.error);
    return;
  }

  if (!pw) {
    setMsg("비밀번호를 입력해 주세요.");
    return;
  }

  setLoading(true);
  setMsg("");
  setAlreadyRegistered(false);

  try {
    const supabase = createSupabaseBrowserClient();
    const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
    const callbackOrigin = configuredSiteUrl ? getSiteUrl() : window.location.origin;
    const callbackUrl = new URL("/auth/callback", callbackOrigin);
    callbackUrl.searchParams.set("next", "/onboarding");
    callbackUrl.searchParams.set("flow", "signup");
    const consentMetadata = buildOwnerLegalConsentMetadata({
      nowISO: new Date().toISOString(),
      marketingAgreed,
    });

    const { data, error } = await supabase.auth.signUp({
      email: emailValidation.value,
      password: pw,
      options: {
        emailRedirectTo: callbackUrl.toString(),
        data: consentMetadata,
      },
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
      title="TimeOpen 시작하기"
      description="사용 중인 이메일로 가입할 수 있어요."
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
              <p className="-mt-2 mb-4 text-xs font-bold leading-5 text-slate-400">
                평소 사용하는 이메일로 가입해도 괜찮아요.
              </p>

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

              <div className="mb-5 rounded-2xl border border-white/70 bg-white/55 p-3 text-sm font-bold text-slate-700 shadow-sm">
                <label className="flex min-w-0 items-start gap-3 rounded-xl px-1 py-2">
                  <input
                    type="checkbox"
                    checked={allConsentsAgreed}
                    onChange={(e) => setAllConsents(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#00C9FF]"
                  />
                  <span>모두 동의</span>
                </label>

                <div className="my-2 h-px bg-slate-200/70" />

                <label className="flex min-w-0 items-start gap-3 rounded-xl px-1 py-2">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#00C9FF]"
                  />
                  <span className="min-w-0 leading-5">
                    [필수]{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noreferrer"
                      className="brand-text underline underline-offset-2"
                    >
                      이용약관
                    </a>
                    에 동의합니다.
                  </span>
                </label>

                <label className="flex min-w-0 items-start gap-3 rounded-xl px-1 py-2">
                  <input
                    type="checkbox"
                    checked={privacyAgreed}
                    onChange={(e) => setPrivacyAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#00C9FF]"
                  />
                  <span className="min-w-0 leading-5">
                    [필수]{" "}
                    <a
                      href="/privacy"
                      target="_blank"
                      rel="noreferrer"
                      className="brand-text underline underline-offset-2"
                    >
                      개인정보 수집·이용
                    </a>
                    에 동의합니다.
                  </span>
                </label>

                <label className="flex min-w-0 items-start gap-3 rounded-xl px-1 py-2">
                  <input
                    type="checkbox"
                    checked={marketingAgreed}
                    onChange={(e) => setMarketingAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#00C9FF]"
                  />
                  <span className="min-w-0 leading-5">
                    [선택] 베타 소식 및 서비스 안내를 이메일로 받아봅니다.
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={onSignup}
                disabled={loading || !requiredConsentsAgreed}
                className="brand-button min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "가입 중..." : "회원가입"}
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
