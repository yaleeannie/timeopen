// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/owner";

  // code 없으면 그냥 next로
  if (!code) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // 실패하면 원인 보기 쉽게 reason도 같이
    return NextResponse.redirect(
      new URL(`/owner?auth=fail&reason=${encodeURIComponent(error.message)}`, url.origin)
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}