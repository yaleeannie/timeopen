// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") ?? "/owner";

  const supabase = await createSupabaseServerClient();

  // (A) PKCE code flow (Google OAuth 등)
  const code = url.searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/owner?auth=fail`, url.origin));
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // (B) verify link flow (Email signup/magic link)
  // supabase /auth/v1/verify -> redirect_to 로 올 때 token/type이 같이 오거나 token_hash로 옴
  const token =
    url.searchParams.get("token") ??
    url.searchParams.get("token_hash") ??
    "";

  const type = (url.searchParams.get("type") ?? "magiclink") as
    | "magiclink"
    | "signup"
    | "recovery"
    | "invite"
    | "email_change";

  if (token) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: token,
    });

    if (error) return NextResponse.redirect(new URL(`/owner?auth=fail`, url.origin));
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // (C) 아무 것도 없으면 owner로
  return NextResponse.redirect(new URL("/owner", url.origin));
}