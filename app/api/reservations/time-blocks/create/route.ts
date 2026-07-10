import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapBlockCreateError(message: string) {
  if (/active reservation overlap/i.test(message)) {
    return "이미 예약이 있는 시간은 막을 수 없어요.";
  }
  if (/time block overlap/i.test(message)) {
    return "이미 막혀 있는 시간이에요.";
  }
  if (/end time must be after start time/i.test(message)) {
    return "종료 시간은 시작 시간보다 늦어야 해요.";
  }
  return "시간을 막지 못했어요. 다시 시도해주세요.";
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const blockDate = text(body?.blockDate ?? body?.block_date);
  const startTime = text(body?.startTime ?? body?.start_time);
  const endTime = text(body?.endTime ?? body?.end_time);
  const reason = text(body?.reason).slice(0, 120);

  if (!DATE_RE.test(blockDate)) {
    return NextResponse.json({ error: "날짜를 선택해주세요." }, { status: 400 });
  }
  if (!TIME_RE.test(startTime)) {
    return NextResponse.json({ error: "시작 시간을 선택해주세요." }, { status: 400 });
  }
  if (!TIME_RE.test(endTime)) {
    return NextResponse.json({ error: "종료 시간을 선택해주세요." }, { status: 400 });
  }
  if (startTime >= endTime) {
    return NextResponse.json(
      { error: "종료 시간은 시작 시간보다 늦어야 해요." },
      { status: 400 }
    );
  }

  const { data: blockId, error } = await supabase.rpc("create_reservation_time_block", {
    p_block_date: blockDate,
    p_start_time: startTime,
    p_end_time: endTime,
    p_reason: reason || null,
  });

  if (error || !blockId) {
    console.error("[time-blocks/create] failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return NextResponse.json(
      { error: mapBlockCreateError(error?.message ?? "") },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    blockId,
    message: "시간이 막혔어요.",
  });
}
