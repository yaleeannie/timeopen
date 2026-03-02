// app/owner/page.tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LogoutButton from "./LogoutButton";

export default async function OwnerPage() {
  const supabase = await createSupabaseServerClient();

  // 1️⃣ 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2️⃣ bootstrap 실행 (organization + handle 자동 생성 / 멱등)
  const { data, error } = await supabase.rpc("bootstrap_owner");

  const row = Array.isArray(data) ? data[0] : data;
  const handle = row?.handle ?? null;
  const orgId = row?.organization_id ?? null;

  return (
    <main style={{ padding: 40, maxWidth: 720 }}>
      {/* 상단 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 28, fontWeight: 900 }}>TimeOpen 판매자 대시보드</h1>
        <LogoutButton />
      </div>

      {/* 계정 정보 */}
      <div style={{ marginTop: 20, fontSize: 14 }}>
        <div>로그인됨: {user.email}</div>
        <div>organizationId: {orgId ?? "-"}</div>
        <div>handle: {handle ?? "-"}</div>
      </div>

      {/* ❌ bootstrap 실패 시 */}
      {error || !handle ? (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #ffd5d5",
            background: "#fff5f5",
            color: "#b00020",
            fontWeight: 800,
          }}
        >
          handle 생성에 실패했습니다. bootstrap 오류입니다.
          {error ? <div style={{ marginTop: 8 }}>{error.message}</div> : null}
        </div>
      ) : (
        <>
          {/* 기능 영역 */}
          <div
            style={{
              marginTop: 30,
              border: "1px solid #e5e5e5",
              borderRadius: 16,
              padding: 20,
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>
              예약 설정
            </div>

            <div style={{ marginBottom: 12 }}>
              <a href="/settings/availability" style={{ textDecoration: "underline", fontWeight: 700 }}>
                영업시간 설정하기
              </a>
            </div>

            <div style={{ marginBottom: 12 }}>
              <a href={`/reservations?handle=${handle}`} style={{ textDecoration: "underline", fontWeight: 700 }}>
                예약 확인
              </a>
            </div>

            <div style={{ marginBottom: 6, fontWeight: 700 }}>예약 링크</div>

            <div style={{ fontSize: 13, marginBottom: 10 }}>
              https://timeopen.app/u/{handle}
            </div>

            <a href={`/u/${handle}`} style={{ textDecoration: "underline", fontWeight: 700 }}>
              예약 페이지 미리보기
            </a>
          </div>
        </>
      )}
    </main>
  );
}