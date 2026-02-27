// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/owner";

  if (!code) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // 실패 시에도 UX는 owner로 보내되 표시만
  if (error) {
    return NextResponse.redirect(new URL(`/owner?auth=fail`, url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}