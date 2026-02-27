import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/owner", url.origin));
  }

  const supabase = await createSupabaseServerClient();

  await supabase.auth.exchangeCodeForSession(code);

  return NextResponse.redirect(new URL("/owner", url.origin));
}