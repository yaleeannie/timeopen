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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // data는 보통 [{ organization_id, handle }] 형태
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ data: row ?? null });
}