// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { bootstrapOwner } from "@/lib/owner/bootstrapOwner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNext(next: string | null) {
  // 오픈 리다이렉트 방지: 내부 경로만 허용
  if (!next) return "/owner";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/owner";
  return next;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const flow = url.searchParams.get("flow");
  const requestedNext = safeNext(url.searchParams.get("next"));
  const next = flow === "signup" ? "/onboarding" : requestedNext;

  // 인증 코드가 없으면 기존 목적지에 실패 정보를 전달합니다.
  if (!code) {
    const failureUrl = new URL(flow === "signup" ? "/login" : next, url.origin);
    failureUrl.searchParams.set("auth", "fail");
    failureUrl.searchParams.set("reason", "missing_code");
    return NextResponse.redirect(failureUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failureUrl = new URL(flow === "signup" ? "/login" : next, url.origin);
    failureUrl.searchParams.set("auth", "fail");
    failureUrl.searchParams.set("reason", error.message);
    return NextResponse.redirect(failureUrl);
  }

  if (flow === "signup") {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[onboarding] user check failed", {
        source: "auth/callback",
        hasUserId: Boolean(user?.id),
        email: user?.email ?? null,
        message: userError?.message ?? "not authenticated after callback",
      });
    } else {
      const bootstrap = await bootstrapOwner(
        supabase,
        { id: user.id, email: user.email },
        "auth/callback"
      );

      if (bootstrap.error || !bootstrap.organizationId) {
        console.error("[onboarding] bootstrap failed", {
          source: "auth/callback",
          userId: user.id,
          email: user.email ?? null,
          error: bootstrap.error,
          hasOrganizationId: Boolean(bootstrap.organizationId),
        });
      }
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
