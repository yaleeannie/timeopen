// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SUPPORTED_OTP_TYPES = [
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
  "email",
] as const;

type SupportedOtpType = (typeof SUPPORTED_OTP_TYPES)[number];

function safeNext(next: string | null) {
  // 오픈 리다이렉트 방지: 내부 경로만 허용
  if (!next) return "/owner";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/owner";
  return next;
}

function normalizeOtpType(type: string | null): SupportedOtpType | null {
  if (!type) return null;
  return (SUPPORTED_OTP_TYPES as readonly string[]).includes(type)
    ? (type as SupportedOtpType)
    : null;
}

function shouldRedirectToOnboarding(flow: string | null, otpType: SupportedOtpType | null) {
  return flow === "signup" || otpType === "signup" || otpType === "email";
}

function buildFailureRedirect(
  origin: string,
  next: string,
  flow: string | null,
  otpType: SupportedOtpType | null
) {
  const isSignupConfirmation = shouldRedirectToOnboarding(flow, otpType);
  const failureUrl = new URL(isSignupConfirmation ? "/login" : next, origin);

  if (isSignupConfirmation || failureUrl.pathname === "/login") {
    failureUrl.searchParams.set("message", "email_confirm_failed");
  } else {
    failureUrl.searchParams.set("auth", "fail");
    failureUrl.searchParams.set("reason", "auth_callback_failed");
  }

  return failureUrl;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = normalizeOtpType(url.searchParams.get("type"));
  const flow = url.searchParams.get("flow");
  const requestedNext = safeNext(url.searchParams.get("next"));
  const next = shouldRedirectToOnboarding(flow, otpType) ? "/onboarding" : requestedNext;

  if (!code && (!tokenHash || !otpType)) {
    console.error("[auth callback] missing code or token_hash", {
      flow,
      type: url.searchParams.get("type"),
    });
    const failureUrl = buildFailureRedirect(url.origin, next, flow, otpType);
    return NextResponse.redirect(failureUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash!,
        type: otpType!,
      });

  if (error) {
    console.error("[auth callback] session exchange failed", {
      flow,
      type: otpType,
      message: error.message,
      status: error.status,
    });
    const failureUrl = buildFailureRedirect(url.origin, next, flow, otpType);
    return NextResponse.redirect(failureUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
