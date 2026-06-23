// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { validateEmail } from "@/features/auth/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const validation = validateEmail(typeof body?.email === "string" ? body.email : "");

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const url = new URL(req.url);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: validation.value,
    options: {
      emailRedirectTo: `${url.origin}/auth/callback?next=/owner`,
    },
  });

  if (error) {
    console.error("[auth/magic-link] signInWithOtp failed", error.message);
    return NextResponse.json(
      { error: "로그인 링크를 보내지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 400 }
    );
  }

  // TODO: beta 안정화 후 Naver/Kakao/Daum 등 국내 메일 수신 성공률을 운영 환경에서 확인한다.
  return NextResponse.json({ ok: true });
}
