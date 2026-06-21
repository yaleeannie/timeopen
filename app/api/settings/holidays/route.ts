import { NextResponse } from "next/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function GET() {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (error || !organizationId) {
    return NextResponse.json(
      { error: error ?? "organization not found" },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: selectError } = await supabase
    .from("organization_holidays")
    .select("id, date, note, created_at")
    .eq("organization_id", organizationId)
    .eq("type", "closed")
    .order("date", { ascending: true });

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 400 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (error || !organizationId) {
    return NextResponse.json(
      { error: error ?? "organization not found" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date.trim() : "";
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!isISODate(date)) {
    return NextResponse.json({ error: "날짜를 선택해주세요." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: upsertError } = await supabase
    .from("organization_holidays")
    .upsert(
      {
        organization_id: organizationId,
        date,
        type: "closed",
        note: note || null,
      },
      { onConflict: "organization_id,date" }
    )
    .select("id, date, note, created_at")
    .single();

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  if (error || !organizationId) {
    return NextResponse.json(
      { error: error ?? "organization not found" },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  const id = typeof body?.id === "string" ? body.id : "";

  if (!id) {
    return NextResponse.json({ error: "휴무일 ID가 필요합니다." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { error: deleteError } = await supabase
    .from("organization_holidays")
    .delete()
    .eq("id", id)
    .eq("organization_id", organizationId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
