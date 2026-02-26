// app/owner/page.tsx
// TimeOpen Seller Hub (NOT a dashboard)
// Just a link collection page.
// This page exists only to verify that Settings / Booking use the SAME organization.

import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";

export default async function OwnerPage() {
  // ✅ demo handle이 어떤 organization에 매핑되는지 "읽기 전용 확인"
  const org = await fetchOrganizationByHandle("demo");

  if (!org) {
    return (
      <div style={{ padding: 20 }}>
        organization not found for handle=demo
      </div>
    );
  }

  // 고객 예약 링크는 환경(로컬/배포)에 따라 origin이 달라질 수 있어서,
  // 클라이언트에서 window.location.origin을 사용해 완전한 URL로 복사한다.
  const handle = org.handle; // "demo"

  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <h2>TimeOpen 판매자 페이지</h2>

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

          <button
            id="copy-booking-link"
            type="button"
            style={{ fontSize: 13, padding: "4px 8px" }}
          >
            복사
          </button>

          <span
            id="copy-status"
            style={{ fontSize: 12, color: "#666" }}
            aria-live="polite"
          />
        </div>

        {/* Server Component를 유지하기 위해 onClick 대신 아주 작은 script로만 처리 */}
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
      // clipboard가 막힌 환경(HTTP/권한) 대비: 최소한의 fallback 안내
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