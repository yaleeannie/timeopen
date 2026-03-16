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

  // ✅ owner 판별을 bootstrap_owner 기준으로 통일
  const { data: boot, error: bootErr } = await supabase.rpc("bootstrap_owner");

  if (bootErr) {
    return NextResponse.json(
      { error: `owner bootstrap 실패: ${bootErr.message}` },
      { status: 403 }
    );
  }

  const row = Array.isArray(boot) ? boot[0] : boot;
  const organizationId = (row?.organization_id as string | null) ?? null;

  if (!organizationId) {
    return NextResponse.json({ error: "접근 권한이 없습니다(owner only)." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (!body || !Array.isArray(body.rows)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const rows = body.rows as Array<{
    weekday: number;
    is_open: boolean;
    work_start: string | null;
    work_end: string | null;
    break_start: string | null;
    break_end: string | null;
  }>;

  // 기존 영업시간 삭제
  const { error: deleteErr } = await supabase
    .from("organization_availability")
    .delete()
    .eq("organization_id", organizationId);

  if (deleteErr) {
    return NextResponse.json({ error: deleteErr.message }, { status: 400 });
  }

  // 새 영업시간 저장
  if (rows.length > 0) {
    const payload = rows.map((r) => ({
      organization_id: organizationId,
      weekday: r.weekday,
      is_open: r.is_open,
      work_start: r.work_start,
      work_end: r.work_end,
      break_start: r.break_start,
      break_end: r.break_end,
    }));

    const { error: insertErr } = await supabase
      .from("organization_availability")
      .insert(payload);

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}