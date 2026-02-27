// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // 배포/로컬 모두 대응
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
    "https://timeopen.vercel.app";

  // ✅ 매직링크가 눌리면 무조건 여기(/auth/callback)로 들어오게
  const emailRedirectTo = `${origin.replace(/^http:\/\//, "https://")}/auth/callback?next=/owner`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo },
  });

  if (error) {
    // Supabase가 rate limit 걸면 보통 여기로 들어옴
    return NextResponse.json({ error: error.message }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}