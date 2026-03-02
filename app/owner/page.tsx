// app/owner/page.tsx
export const dynamic = "force-dynamic";

import OwnerAuthBox from "./OwnerAuthBox";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerPage() {
  const supabase = await createSupabaseServerClient();

  // 1) 로그인 확인
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return (
      <div style={{ padding: 20 }}>
        <h2 style={{ marginBottom: 12 }}>TimeOpen 판매자 페이지</h2>
        <OwnerAuthBox />
      </div>
    );
  }

  // 2) 로그인 상태면: bootstrap 실행 (멱등)
  const { data: boot, error: bootErr } = await supabase.rpc("bootstrap_owner");

  // 3) bootstrap 결과에서 handle/orgId 뽑기
  const row = Array.isArray(boot) ? boot[0] : boot;
  const orgId = row?.out_organization_id ?? null;
  const handle = row?.out_handle ?? null;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginBottom: 12 }}>TimeOpen 판매자 페이지</h2>

      {/* 로그인 UI 카드 */}
      <OwnerAuthBox />

      {/* 디버그 표시 */}
      <div style={{ marginTop: 14, fontSize: 13, color: "#444" }}>
        <div>user: {user.email}</div>
        <div>organizationId: {orgId ?? "-"}</div>
        <div>handle: {handle ?? "-"}</div>
        {bootErr ? <div style={{ color: "#b00020" }}>bootstrap error: {bootErr.message}</div> : null}
      </div>

      {/* 링크들 */}
      {handle ? (
        <>
          <div style={{ marginTop: 18 }}>
            <div style={{ marginBottom: 6, fontWeight: 700 }}>내 예약 링크</div>
            <a href={`/u/${handle}`} style={{ textDecoration: "underline" }}>
              /u/{handle}
            </a>
          </div>

          <div style={{ marginTop: 16 }}>
            <a href="/settings/availability" style={{ textDecoration: "underline" }}>
              영업시간 설정으로 이동
            </a>
          </div>

          <div style={{ marginTop: 12 }}>
            <a href={`/reservations?handle=${handle}`} style={{ textDecoration: "underline" }}>
              예약 확인
            </a>
          </div>
        </>
      ) : (
        <div style={{ marginTop: 18, color: "#b00020", fontWeight: 700 }}>
          handle이 아직 없어요. bootstrap이 실패했을 수 있어요.
        </div>
      )}
    </div>
  );
}