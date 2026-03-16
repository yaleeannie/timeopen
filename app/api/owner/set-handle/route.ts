import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const handle = typeof body?.handle === "string" ? body.handle : "";

  const { data, error } = await supabase.rpc("set_my_handle", { p_handle: handle });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ data: row ?? null });
}