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

type CallbackDiagnostics = {
  hasCode: boolean;
  hasTokenHash: boolean;
  type: string | null;
  flow: string | null;
  hasError: boolean;
  errorCode: string | null;
};

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

function getCallbackDiagnostics(url: URL): CallbackDiagnostics {
  return {
    hasCode: url.searchParams.has("code"),
    hasTokenHash: url.searchParams.has("token_hash"),
    type: url.searchParams.get("type"),
    flow: url.searchParams.get("flow"),
    hasError: url.searchParams.has("error") || url.searchParams.has("error_code"),
    errorCode: url.searchParams.get("error_code"),
  };
}

function logCallbackDiagnostic(
  level: "info" | "warn" | "error",
  message: string,
  metadata: CallbackDiagnostics & Record<string, unknown>
) {
  if (process.env.NODE_ENV === "production") return;
  console[level](message, metadata);
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

async function verifyTokenHash(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  tokenHash: string,
  otpType: SupportedOtpType
) {
  const primary = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: otpType,
  });

  if (!primary.error || otpType !== "signup") {
    return primary;
  }

  // 일부 Supabase 이메일 템플릿/링크는 signup 확인 토큰을 email 타입으로 검증해야 할 수 있습니다.
  // 토큰 자체는 동일하게 Supabase에서 검증하므로, code/token 값을 노출하거나 우회하지 않습니다.
  return supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: "email",
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = normalizeOtpType(url.searchParams.get("type"));
  const flow = url.searchParams.get("flow");
  const hasCallbackError = url.searchParams.has("error") || url.searchParams.has("error_code");
  const requestedNext = safeNext(url.searchParams.get("next"));
  const next = shouldRedirectToOnboarding(flow, otpType) ? "/onboarding" : requestedNext;
  const diagnostics = getCallbackDiagnostics(url);

  if (hasCallbackError) {
    logCallbackDiagnostic("warn", "[auth callback] provider returned error", diagnostics);
    const failureUrl = buildFailureRedirect(url.origin, next, flow, otpType);
    return NextResponse.redirect(failureUrl);
  }

  if (!code && (!tokenHash || !otpType)) {
    logCallbackDiagnostic("warn", "[auth callback] missing code or token_hash", diagnostics);
    const failureUrl = buildFailureRedirect(url.origin, next, flow, otpType);
    return NextResponse.redirect(failureUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await verifyTokenHash(supabase, tokenHash!, otpType!);

  if (error) {
    logCallbackDiagnostic("error", "[auth callback] session exchange failed", {
      ...diagnostics,
      status: error.status,
      errorName: error.name,
    });
    const failureUrl = buildFailureRedirect(url.origin, next, flow, otpType);
    return NextResponse.redirect(failureUrl);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
