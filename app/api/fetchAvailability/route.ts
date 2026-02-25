import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { organizationId } = await req.json();

  if (!organizationId || typeof organizationId !== "string") {
  return NextResponse.json({ error: "organizationId required" }, { status: 400 });
    }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from("organization_availability")
    .select("*")
    .eq("organization_id", organizationId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}