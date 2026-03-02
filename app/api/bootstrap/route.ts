// app/api/bootstrap/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabase.rpc("bootstrap_owner");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.organization_id || !row?.handle) {
    return NextResponse.json({ error: "bootstrap_owner returned empty" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: row });
}