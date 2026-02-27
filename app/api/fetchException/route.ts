import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { organizationId, dateISO } = body ?? {};

  if (!organizationId || typeof organizationId !== "string") {
    return NextResponse.json({ error: "organizationId required" }, { status: 400 });
  }
  if (!dateISO || typeof dateISO !== "string") {
    return NextResponse.json({ error: "dateISO required" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("organization_availability_exceptions")
    .select("is_closed, work_windows, breaks")
    .eq("organization_id", organizationId)
    .eq("date", dateISO)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? null });
}