// app/owner/page.tsx
// TimeOpen Seller Hub (NOT a dashboard)
// Just a link collection page.
// ✅ 최소 수정: 로그인/로그아웃 버튼 + 로그인 상태 표시만 추가

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ✅ 로그아웃 (서버 액션)
  async function signOut() {
    "use server";
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  // ✅ demo handle이 어떤 organization에 매핑되는지 "읽기 전용 확인"
  const org = await fetchOrganizationByHandle("demo");

  if (!org) {
    return <div style={{ padding: 20 }}>organization not found for handle=demo</div>;
  }

  const handle = org.handle; // "demo"

  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0 }}>TimeOpen 판매자 페이지</h2>

        {/* ✅ 로그인/로그아웃 버튼 (최소 UI) */}
        {user ? (
          <form action={signOut}>
            <button type="submit" style={{ fontSize: 13, padding: "6px 10px" }}>
              로그아웃
            </button>
          </form>
        ) : (
          <Link href="/login" style={{ fontSize: 13, padding: "6px 10px", border: "1px solid #ddd", borderRadius: 8 }}>
            로그인
          </Link>
        )}
      </div>

      {/* ✅ 로그인 상태 표시 (최소 텍스트) */}
      <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
        {user ? <div>로그인됨: {user.email ?? user.id}</div> : <div>로그인이 필요합니다.</div>}
      </div>

      {/* 🔒 정합성 확인용 (절대 수정 기능 아님, 그냥 표시만) */}
      <div style={{ marginTop: 10, fontSize: 13, color: "#666" }}>
        <div>organizationId: {org.id}</div>
        <div>handle: {org.handle}</div>
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/settings/availability">영업시간 설정으로 이동</a>
      </div>

      <div style={{ marginTop: 12 }}>
        <a href={`/reservations?handle=${org.handle}`}>예약 확인 (Debug View)</a>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 6 }}>고객 예약 링크:</div>

        {/* 링크는 그대로 보이되, "복사" 버튼만 제공 (UI 확장 금지) */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <code id="booking-link-text" data-handle={handle}>
            /u/{handle}
          </code>

          <button id="copy-booking-link" type="button" style={{ fontSize: 13, padding: "4px 8px" }}>
            복사
          </button>

          <span id="copy-status" style={{ fontSize: 12, color: "#666" }} aria-live="polite" />
        </div>

        {/* Server Component 유지: onClick 대신 script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  var btn = document.getElementById("copy-booking-link");
  var textEl = document.getElementById("booking-link-text");
  var status = document.getElementById("copy-status");
  if (!btn || !textEl) return;

  btn.addEventListener("click", async function () {
    try {
      var handle = textEl.getAttribute("data-handle") || "demo";
      var url = window.location.origin + "/u/" + handle;
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = "복사됨";
      setTimeout(function () { if (status) status.textContent = ""; }, 1200);
    } catch (e) {
      if (status) status.textContent = "복사 실패(권한)";
      setTimeout(function () { if (status) status.textContent = ""; }, 1500);
    }
  });
})();`,
          }}
        />
      </div>
    </div>
  );
}