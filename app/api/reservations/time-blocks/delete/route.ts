import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const blockId = text(body?.blockId ?? body?.block_id);

  if (!blockId) {
    return NextResponse.json({ error: "막힌 시간을 찾지 못했어요." }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("delete_reservation_time_block", {
    p_block_id: blockId,
  });

  if (error || !data) {
    console.error("[time-blocks/delete] failed", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    return NextResponse.json(
      { error: "막힌 시간을 해제하지 못했어요. 다시 시도해주세요." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    blockId: data,
    message: "막힌 시간이 해제되었어요.",
  });
}
