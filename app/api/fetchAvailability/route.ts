// app/api/fetchAvailability/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { handle } = await req.json();

  if (!handle) {
    return NextResponse.json({ data: [], error: "Missing handle" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("get_availability_rows_by_handle", {
    p_handle: handle,
  });

  if (error) {
    return NextResponse.json({ data: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}