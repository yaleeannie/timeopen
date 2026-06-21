import { NextResponse } from "next/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServiceRequest = {
  id?: unknown;
  name?: unknown;
  durationMin?: unknown;
  price?: unknown;
};

type ParsedService = {
  id: string | null;
  name: string;
  durationMin: number;
  hasPrice: boolean;
  price: number;
};

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

  if (!body || !Array.isArray(body.services)) {
    return NextResponse.json({ error: "서비스 목록이 필요합니다." }, { status: 400 });
  }

  const services: ParsedService[] = (body.services as ServiceRequest[]).map(
    (service) => ({
      id: typeof service?.id === "string" ? service.id : null,
      name: typeof service?.name === "string" ? service.name.trim() : "",
      durationMin: Number(service?.durationMin),
      hasPrice: String(service?.price ?? "").trim() !== "",
      price: Number(service?.price),
    })
  );

  for (const [index, service] of services.entries()) {
    if (!service.name) {
      return NextResponse.json(
        { error: `${index + 1}번째 서비스명을 입력해주세요.` },
        { status: 400 }
      );
    }

    if (!Number.isInteger(service.durationMin) || service.durationMin <= 0) {
      return NextResponse.json(
        { error: `${index + 1}번째 서비스의 소요 시간을 확인해주세요.` },
        { status: 400 }
      );
    }

    if (!service.hasPrice || !Number.isFinite(service.price) || service.price < 0) {
      return NextResponse.json(
        { error: `${index + 1}번째 서비스의 가격을 확인해주세요.` },
        { status: 400 }
      );
    }
  }

  const normalizedNames = services.map((service) => service.name.toLocaleLowerCase());
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    return NextResponse.json(
      { error: "같은 이름의 서비스를 중복해서 등록할 수 없습니다." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data: existingServices, error: lookupError } = await supabase
    .from("services")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("active", true);

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 400 });
  }

  const existingIds = new Set((existingServices ?? []).map((service) => String(service.id)));
  const keptExistingIds: string[] = [];
  const savedServices = [];

  for (const service of services) {
    const values = {
      name: service.name,
      duration_min: service.durationMin,
      price: service.price,
      active: true,
    };

    if (service.id && !existingIds.has(service.id)) {
      return NextResponse.json(
        { error: "수정할 서비스를 찾을 수 없습니다. 화면을 새로고침해 주세요." },
        { status: 400 }
      );
    }

    if (service.id && existingIds.has(service.id)) {
      const { data, error: updateError } = await supabase
        .from("services")
        .update(values)
        .eq("id", service.id)
        .eq("organization_id", organizationId)
        .select("id, name, duration_min, price, active")
        .single();

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      keptExistingIds.push(service.id);
      savedServices.push(data);
      continue;
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

    savedServices.push(data);
  }

  const removedIds = [...existingIds].filter((id) => !keptExistingIds.includes(id));
  if (removedIds.length > 0) {
    const { error: deactivateError } = await supabase
      .from("services")
      .update({ active: false })
      .eq("organization_id", organizationId)
      .in("id", removedIds);

    if (deactivateError) {
      return NextResponse.json({ error: deactivateError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true, data: savedServices });
}
