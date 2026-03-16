// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNext(next: string | null) {
  // 오픈 리다이렉트 방지: 내부 경로만 허용
  if (!next) return "/owner";
  if (!next.startsWith("/")) return "/owner";
  return next;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  // code 없으면 next(기본 /owner)로
  if (!code) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`${next}?auth=fail&reason=${encodeURIComponent(error.message)}`, url.origin)
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}