// app/api/bootstrap/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bootstrapOwner } from "@/lib/owner/bootstrapOwner";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await request.json().catch(() => ({}));
  const source = body?.source === "onboarding-retry" ? "onboarding-retry" : "api/bootstrap";

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    console.error("[bootstrap] no session", {
      source,
      hasUserId: Boolean(user?.id),
      email: user?.email ?? null,
      message: userErr?.message ?? "not authenticated",
    });
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  console.log("[bootstrap] api user", {
    source,
    userId: user.id,
    email: user.email ?? null,
  });

  const result = await bootstrapOwner(supabase, { id: user.id, email: user.email }, source);

  if (result.error || !result.organizationId) {
    console.error("[bootstrap] result empty", {
      source,
      userId: user.id,
      email: user.email ?? null,
      error: result.error,
      hasOrganizationId: Boolean(result.organizationId),
    });
    if (source === "onboarding-retry") {
      console.error("[onboarding] bootstrap retry failure", {
        userId: user.id,
        email: user.email ?? null,
        error: result.error,
      });
    }
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.log("[bootstrap] rpc success", {
    source: "api/bootstrap",
    userId: user.id,
    email: user.email ?? null,
    organizationId: result.organizationId,
    handle: result.handle,
  });

  if (source === "onboarding-retry") {
    console.log("[onboarding] bootstrap retry success", {
      userId: user.id,
      email: user.email ?? null,
      organizationId: result.organizationId,
      handle: result.handle,
    });
  }

  return NextResponse.json({
    ok: true,
    organizationId: result.organizationId,
    handle: result.handle,
  });
}
