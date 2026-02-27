// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email, redirectTo } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  // redirectTo는 프론트에서 /owner로 넘겨줄 거고,
  // 혹시 안 오면 기본값은 /owner로 처리
  const safeRedirect =
    typeof redirectTo === "string" && redirectTo.length > 0
      ? redirectTo
      : `${new URL(req.url).origin}/owner`;

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: safeRedirect, // ✅ 메일 링크 누르면 /owner로 돌아오게
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}