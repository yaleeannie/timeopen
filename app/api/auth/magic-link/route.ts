// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function normalizeEmail(v: string) {
  return v.trim().toLowerCase();
}

function parseOwnerEmails(env?: string | null) {
  return (env ?? "")
    .split(",")
    .map((s) => normalizeEmail(s))
    .filter(Boolean);
}

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  // ✅ A안 핵심: 허용된 owner 이메일만 로그인 메일 발송
  const owners = parseOwnerEmails(process.env.OWNER_EMAILS);
  const e = normalizeEmail(email);

  if (owners.length === 0) {
    return NextResponse.json(
      { error: "OWNER_EMAILS not set on server" },
      { status: 500 }
    );
  }

  if (!owners.includes(e)) {
    return NextResponse.json(
      { error: "허용되지 않은 이메일입니다. (owner 전용)" },
      { status: 403 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // ✅ 배포/로컬 모두 커버 (가능하면 NEXT_PUBLIC_SITE_URL도 추가해도 됨)
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
    "https://timeopen.vercel.app";

  const redirectTo = `${origin}/auth/callback?next=/owner`;

  const { error } = await supabase.auth.signInWithOtp({
    email: e,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}