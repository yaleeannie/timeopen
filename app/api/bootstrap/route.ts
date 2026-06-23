// app/api/bootstrap/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { bootstrapOwner } from "@/lib/owner/bootstrapOwner";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    console.error("[bootstrap] no session", {
      source: "api/bootstrap",
      hasUserId: Boolean(user?.id),
      email: user?.email ?? null,
      message: userErr?.message ?? "not authenticated",
    });
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const result = await bootstrapOwner(
    supabase,
    { id: user.id, email: user.email },
    "api/bootstrap"
  );

  if (result.error || !result.organizationId) {
    console.error("[bootstrap] result empty", {
      source: "api/bootstrap",
      userId: user.id,
      email: user.email ?? null,
      error: result.error,
      hasOrganizationId: Boolean(result.organizationId),
    });
    return NextResponse.json(
      { error: result.error ?? "bootstrap_owner returned empty" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      organization_id: result.organizationId,
      handle: result.handle,
    },
  });
}
