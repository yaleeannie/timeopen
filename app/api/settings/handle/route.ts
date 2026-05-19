import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";

function isValidHandle(v: string) {
  return /^[a-z0-9\-]{3,30}$/.test(v);
}

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "login required" }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json({ error: error ?? "organization not found" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const handle = typeof body?.handle === "string" ? body.handle.trim().toLowerCase() : "";

  if (!handle) {
    return NextResponse.json({ error: "handle을 입력해주세요." }, { status: 400 });
  }

  if (!isValidHandle(handle)) {
    return NextResponse.json(
      { error: "handle은 영어 소문자, 숫자, 하이픈(-)만 사용 가능하며 3~30자여야 합니다." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();

  // 중복 체크
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  if (existing && existing.id !== organizationId) {
    return NextResponse.json({ error: "이미 사용 중인 handle입니다." }, { status: 400 });
  }

  const { error: updateErr } = await supabase
    .from("organizations")
    .update({ handle })
    .eq("id", organizationId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}