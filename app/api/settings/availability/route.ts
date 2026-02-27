// app/api/settings/availability/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const organizationId = String(body?.organizationId ?? "");
    const state = body?.state;

    if (!organizationId) {
      return NextResponse.json({ error: "organizationId is required" }, { status: 400 });
    }
    if (!state || typeof state !== "object") {
      return NextResponse.json({ error: "state is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // ✅ (권장) owner 검증: user가 organizationId의 owner인지 확인
    const { data: m, error: mErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();

    if (mErr || !m) {
      return NextResponse.json({ error: "접근 권한이 없습니다(owner only)." }, { status: 403 });
    }

    // ✅ payload 만들기: client에서 넘어온 state를 그대로 쓰지 말고 서버에서 shape 고정
    const WEEKDAYS = [
      { key: "mon", weekday: 1 },
      { key: "tue", weekday: 2 },
      { key: "wed", weekday: 3 },
      { key: "thu", weekday: 4 },
      { key: "fri", weekday: 5 },
      { key: "sat", weekday: 6 },
      { key: "sun", weekday: 0 },
    ] as const;

    const normalizeTime = (v?: string | null) => {
      if (!v) return null;
      if (typeof v !== "string") return null;
      if (v.length < 4) return null;
      return v.slice(0, 5);
    };

    const payload = WEEKDAYS.map(({ key, weekday }) => {
      const d = state?.[key] ?? {};

      if (!d.open) {
        return {
          organization_id: organizationId,
          weekday,
          is_open: false,
          work_start: null,
          work_end: null,
          break_start: null,
          break_end: null,
        };
      }

      return {
        organization_id: organizationId,
        weekday,
        is_open: true,
        work_start: normalizeTime(d.work_start),
        work_end: normalizeTime(d.work_end),
        break_start: normalizeTime(d.break_start),
        break_end: normalizeTime(d.break_end),
      };
    });

    const { data, error } = await supabase
      .from("organization_availability")
      .upsert(payload, { onConflict: "organization_id,weekday" })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown error" }, { status: 500 });
  }
}