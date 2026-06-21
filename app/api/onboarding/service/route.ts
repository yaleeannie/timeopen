import { NextResponse } from "next/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const durationMin = Number(body?.durationMin);
  const hasPrice = String(body?.price ?? "").trim() !== "";
  const price = Number(body?.price);

  if (!name) {
    return NextResponse.json({ error: "서비스명을 입력해주세요." }, { status: 400 });
  }

  if (!Number.isInteger(durationMin) || durationMin <= 0) {
    return NextResponse.json(
      { error: "소요 시간은 1분 이상의 정수로 입력해주세요." },
      { status: 400 }
    );
  }

  if (!hasPrice || !Number.isFinite(price) || price < 0) {
    return NextResponse.json(
      { error: "가격을 0원 이상의 숫자로 입력해주세요." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingService, error: lookupError } = await supabase
    .from("services")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 });
  }

  const values = {
    name,
    duration_min: durationMin,
    price,
    active: true,
  };

  if (existingService?.id) {
    const { data, error: updateError } = await supabase
      .from("services")
      .update(values)
      .eq("id", existingService.id)
      .eq("organization_id", organizationId)
      .select("id, name, duration_min, price, active")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data, created: false });
  }

  const { data, error: insertError } = await supabase
    .from("services")
    .insert({
      organization_id: organizationId,
      ...values,
    })
    .select("id, name, duration_min, price, active")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data, created: true });
}
