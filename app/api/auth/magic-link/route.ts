// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  // ✅ 절대 URL 하드코딩 (이게 핵심)
  const redirectTo = "https://timeopen.vercel.app/auth/callback?next=/owner";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 429 });
  }

  return NextResponse.json({ ok: true });
}