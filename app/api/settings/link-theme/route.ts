import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { isLinkTheme } from "@/features/booking/themes";

export async function POST(req: Request) {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (error || !organizationId) {
    return NextResponse.json(
      { error: error ?? "샵 정보를 찾을 수 없습니다." },
      { status: 400 }
    );
  }

  const body: unknown = await req.json().catch(() => null);
  const linkTheme =
    typeof body === "object" && body !== null && "link_theme" in body
      ? (body as { link_theme?: unknown }).link_theme
      : null;

  if (!isLinkTheme(linkTheme)) {
    return NextResponse.json(
      { error: "지원하지 않는 예약 링크 테마입니다." },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error: updateError } = await supabase
    .from("organizations")
    .update({ link_theme: linkTheme })
    .eq("id", organizationId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, link_theme: linkTheme });
}
