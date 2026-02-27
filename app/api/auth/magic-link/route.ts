// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const emailRaw = body?.email;

  if (!emailRaw || typeof emailRaw !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const email = normalizeEmail(emailRaw);

  // ✅ A안 핵심: owner allowlist (원하는 방식으로 바꿔도 됨)
  // 가장 간단하게: 환경변수에 owner 이메일 넣기
  // 예: OWNER_EMAILS="yaleeannie@gmail.com,other@domain.com"
  const allow = (process.env.OWNER_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length > 0 && !allow.includes(email)) {
    // 보안상 "없는 계정" 느낌으로 응답해도 되지만, 운영 편하게 명확히 막자
    return NextResponse.json(
      { error: "허용되지 않은 이메일입니다. owner 이메일만 로그인 가능해요." },
      { status: 403 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // ✅ redirect는 고정 OK (프로덕션 기준)
  // 로컬에서도 쓰고 싶으면 아래처럼 분기해도 됨:
  // const origin = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://timeopen.vercel.app";
  const redirectTo = "https://timeopen.vercel.app/auth/callback?next=/owner";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    // rate limit / 설정오류 / 기타 에러를 그대로 전달
    // (서버 내부 메시지 노출이 싫으면 error.message를 일반화해도 됨)
    return NextResponse.json(
      { error: error.message },
      { status: error.status ?? 400 }
    );
  }

  return NextResponse.json({ ok: true });
}