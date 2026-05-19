import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";

export async function POST(req: Request) {
  try {
    const { user, organizationId, error } = await getOwnerContext();

    if (!user) {
      return NextResponse.json({ error: "login required" }, { status: 401 });
    }

    if (error || !organizationId) {
      return NextResponse.json(
        { error: error ?? "organization not found" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json(
        { error: "서비스명을 입력해주세요." },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();

    const { error: updateErr } = await supabase
      .from("organizations")
      .update({ name })
      .eq("id", organizationId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    const { data: checkRow, error: checkErr } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("id", organizationId)
      .maybeSingle();

    if (checkErr) {
      return NextResponse.json({ error: checkErr.message }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      organizationId,
      savedName: checkRow?.name ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}