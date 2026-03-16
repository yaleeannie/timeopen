export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import LogoutButton from "./LogoutButton";
import ProfileEditor from "./ProfileEditor";

export default async function OwnerPage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>TimeOpen 판매자 대시보드</h1>
        <div style={{ marginTop: 12, color: "#b00020", fontWeight: 800 }}>
          owner 정보를 불러오지 못했습니다: {error}
        </div>
      </main>
    );
  }

  if (!organizationId) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>TimeOpen 판매자 대시보드</h1>
        <div style={{ marginTop: 12, color: "#b00020", fontWeight: 800 }}>
          organizationId를 찾을 수 없습니다.
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("handle, location_text, notice_text")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgErr) {
    return (
      <main style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>TimeOpen 판매자 대시보드</h1>
        <div style={{ marginTop: 12, color: "#b00020", fontWeight: 800 }}>
          organizations 조회 오류: {orgErr.message}
        </div>
      </main>
    );
  }

  const locationText = (orgRow?.location_text as string | null) ?? "";
  const noticeText = (orgRow?.notice_text as string | null) ?? "";
  const finalHandle = (orgRow?.handle as string | null) ?? handle;

  const canLink = !!finalHandle && finalHandle !== "null";

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900 }}>TimeOpen 판매자 대시보드</h1>
        <LogoutButton />
      </div>

      <div style={{ marginTop: 12, fontSize: 13, color: "#444" }}>
        <div>로그인됨: {user.email}</div>
        <div>handle: {finalHandle ?? "-"}</div>
      </div>

      <div style={{ marginTop: 18 }}>
        <div style={{ marginTop: 10 }}>
          <a href="/settings/availability" style={{ textDecoration: "underline", fontWeight: 800 }}>
            영업시간 설정
          </a>
        </div>

        <div style={{ marginTop: 10 }}>
          {canLink ? (
            <a
              href={`/reservations?handle=${finalHandle}`}
              style={{ textDecoration: "underline", fontWeight: 800 }}
            >
              예약 확인
            </a>
          ) : (
            <span style={{ color: "#b00020", fontWeight: 800 }}>handle이 없어 예약 확인을 열 수 없습니다.</span>
          )}
        </div>

        <div style={{ marginTop: 10 }}>
          {canLink ? (
            <a href={`/u/${finalHandle}`} style={{ textDecoration: "underline", fontWeight: 800 }}>
              예약 링크 미리보기
            </a>
          ) : (
            <span style={{ color: "#b00020", fontWeight: 800 }}>handle이 없어 예약 링크를 만들 수 없습니다.</span>
          )}
        </div>
      </div>

      <ProfileEditor
        organizationId={organizationId}
        initialLocation={locationText}
        initialNotice={noticeText}
      />
    </main>
  );
}