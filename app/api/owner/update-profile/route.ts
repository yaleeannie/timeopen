import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FIELD_LIMITS, validateOptionalText } from "@/features/validation/fieldLimits";

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

  const booking_contact =
    typeof body?.booking_contact === "string" ? body.booking_contact.trim() : "";

  const booking_notice =
    typeof body?.booking_notice === "string" ? body.booking_notice.trim() : "";

  const locationValidation = validateOptionalText(
    location_text,
    FIELD_LIMITS.noticeMax,
    "위치 안내"
  );
  if (!locationValidation.ok) {
    return NextResponse.json({ error: locationValidation.error }, { status: 400 });
  }

  const noticeValidation = validateOptionalText(
    notice_text,
    FIELD_LIMITS.noticeMax,
    "방문 안내문"
  );
  if (!noticeValidation.ok) {
    return NextResponse.json({ error: noticeValidation.error }, { status: 400 });
  }

  const bookingContactValidation = validateOptionalText(
    booking_contact,
    FIELD_LIMITS.bookingContactMax,
    "예약 문의 연락처"
  );
  if (!bookingContactValidation.ok) {
    return NextResponse.json(
      { error: bookingContactValidation.error },
      { status: 400 }
    );
  }

  const bookingNoticeValidation = validateOptionalText(
    booking_notice,
    FIELD_LIMITS.noticeMax,
    "예약 안내문"
  );
  if (!bookingNoticeValidation.ok) {
    return NextResponse.json(
      { error: bookingNoticeValidation.error },
      { status: 400 }
    );
  }

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
      booking_contact: booking_contact || null,
      booking_notice: booking_notice || null,
    })
    .eq("id", organizationId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
