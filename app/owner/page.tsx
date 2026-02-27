// app/owner/page.tsx
import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";
import OwnerAuthBox from "./OwnerAuthBox";

export default async function OwnerPage() {
  const org = await fetchOrganizationByHandle("demo");

  if (!org) {
    return <div style={{ padding: 20 }}>organization not found for handle=demo</div>;
  }

  const handle = org.handle;

  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <h2>TimeOpen 판매자 페이지</h2>

      {/* ✅ 로그인 UI (제품급: 상태 기반 + 쿨다운 + 중복전송 방지) */}
      <OwnerAuthBox />

      <div style={{ marginTop: 14, fontSize: 13, color: "#666" }}>
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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <code id="booking-link-text" data-handle={handle}>
            /u/{handle}
          </code>
          <button id="copy-booking-link" type="button" style={{ fontSize: 13, padding: "4px 8px" }}>
            복사
          </button>
          <span id="copy-status" style={{ fontSize: 12, color: "#666" }} aria-live="polite" />
        </div>

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