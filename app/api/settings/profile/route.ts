import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import {
  FIELD_LIMITS,
  validateOptionalText,
  validateShopName,
} from "@/features/validation/fieldLimits";

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
    const nameInput = typeof body?.name === "string" ? body.name : "";
    const hasLocationText = typeof body?.location_text === "string";
    const hasNoticeText = typeof body?.notice_text === "string";

    const nameValidation = validateShopName(nameInput);
    if (!nameValidation.ok) {
      return NextResponse.json({ error: nameValidation.error }, { status: 400 });
    }

    if (hasLocationText) {
      const locationValidation = validateOptionalText(
        body.location_text,
        FIELD_LIMITS.noticeMax,
        "위치 안내"
      );
      if (!locationValidation.ok) {
        return NextResponse.json({ error: locationValidation.error }, { status: 400 });
      }
    }

    if (hasNoticeText) {
      const noticeValidation = validateOptionalText(
        body.notice_text,
        FIELD_LIMITS.noticeMax,
        "방문 안내문"
      );
      if (!noticeValidation.ok) {
        return NextResponse.json({ error: noticeValidation.error }, { status: 400 });
      }
    }

    const supabase = await createSupabaseServerClient();
    const updates: {
      name: string;
      location_text?: string | null;
      notice_text?: string | null;
    } = { name: nameValidation.value };

    if (hasLocationText) {
      updates.location_text = body.location_text.trim() || null;
    }

    if (hasNoticeText) {
      updates.notice_text = body.notice_text.trim() || null;
    }

    const { error: updateErr } = await supabase
      .from("organizations")
      .update(updates)
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
