"use client";

import { useState } from "react";
import AuthShell from "@/components/AuthShell";
import { validateEmail } from "@/features/auth/email";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [magicLoading, setMagicLoading] = useState(false);

  async function onLogin() {
    const emailValidation = validateEmail(email);
    if (!emailValidation.ok) {
      setMsg(emailValidation.error);
      return;
    }

    if (!pw) {
      setMsg("비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const supabase = createSupabaseBrowserClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: emailValidation.value,
        password: pw,
      });

      if (error) {
        // 흔한 케이스들 UX 개선
        const m = (error.message || "").toLowerCase();

        if (m.includes("invalid login credentials")) {
          setMsg("이메일 또는 비밀번호가 맞지 않아요. 비밀번호를 잊으셨다면 재설정을 눌러주세요.");
        } else if (m.includes("email not confirmed")) {
          setMsg("이메일 인증이 아직 완료되지 않았어요. 메일함에서 인증 링크를 먼저 눌러주세요.");
        } else {
          setMsg(error.message);
        }
        return;
      }

      window.location.href = "/owner";
    } catch {
      setMsg("네트워크 오류입니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function onMagicLink() {
    const emailValidation = validateEmail(email);
    if (!emailValidation.ok) {
      setMsg(emailValidation.error);
      return;
    }

    setMagicLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValidation.value }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(json?.error ?? "로그인 링크를 보내지 못했습니다.");
        return;
      }

      setMsg("로그인 링크를 보냈습니다. 메일함을 확인해주세요.");
    } catch {
      setMsg("네트워크 오류입니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setMagicLoading(false);
    }
  }

  return (
    <AuthShell
      title="다시 오신 걸 환영해요"
      description="이메일 주소를 입력하면 로그인 링크를 보내드려요."
    >
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
            네이버·카카오·다음·Gmail·회사 이메일 모두 사용할 수 있어요.
          </p>

          <button
            type="button"
            onClick={onMagicLink}
            disabled={magicLoading || loading}
            className="brand-button mb-4 min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {magicLoading ? "전송 중..." : "이메일로 시작하기"}
          </button>

          <div className="mb-4 flex items-center gap-3 text-xs font-bold text-slate-300">
            <span className="h-px flex-1 bg-slate-200" />
            <span>또는 비밀번호로 로그인</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="text-sm font-bold text-slate-700">비밀번호</label>
            <a href="/forgot-password" className="brand-text text-xs font-bold">
              비밀번호 찾기
            </a>
          </div>
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="비밀번호"
            type="password"
            autoComplete="current-password"
            className="brand-input mb-5 min-h-12 w-full min-w-0 rounded-2xl px-4 py-3 text-base"
          />

          <button
            type="button"
            onClick={onLogin}
            disabled={loading}
            className="brand-button min-h-12 w-full rounded-2xl px-4 py-3 text-base font-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "처리 중..." : "로그인"}
          </button>

          {msg ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-5 text-red-700 [overflow-wrap:anywhere]">
              {msg}
            </div>
          ) : null}

          <div className="mt-5 text-center text-sm">
            <a href="/signup" className="brand-outline flex min-h-11 items-center justify-center rounded-xl px-3 py-3 font-bold">
              처음이에요 → 회원가입
            </a>
          </div>
    </AuthShell>
  );
}
