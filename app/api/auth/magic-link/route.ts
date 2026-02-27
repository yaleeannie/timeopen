// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "") ||
    "https://timeopen.vercel.app";

  const redirectTo = `${origin}/auth/callback?next=/owner`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    // rate limit도 여기로 들어올 수 있음
    return NextResponse.json({ error: error.message }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}