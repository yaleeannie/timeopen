// app/api/auth/magic-link/route.ts
import { NextResponse } from "next/server";
import { validateEmail } from "@/features/auth/email";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const validation = validateEmail(typeof body?.email === "string" ? body.email : "");

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const url = new URL(req.url);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: validation.value,
    options: {
      emailRedirectTo: `${url.origin}/auth/callback?next=/owner`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
