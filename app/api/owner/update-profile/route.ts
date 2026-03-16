import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const organizationId =
    typeof body?.organizationId === "string" ? body.organizationId : null;

  const location_text =
    typeof body?.location_text === "string" ? body.location_text.trim() : "";

  const notice_text =
    typeof body?.notice_text === "string" ? body.notice_text.trim() : "";

  if (!organizationId) {
    return NextResponse.json({ error: "organizationId가 필요합니다." }, { status: 400 });
  }

  // owner 권한 확인
  const { data: member, error: memberErr } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (memberErr || !member) {
    return NextResponse.json({ error: "owner only" }, { status: 403 });
  }

  const { error: updateErr } = await supabase
    .from("organizations")
    .update({
      location_text: location_text || null,
      notice_text: notice_text || null,
    })
    .eq("id", organizationId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}