// app/owner/page.tsx
import OwnerAuthBox from "./OwnerAuthBox";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 전: 로그인 UI만
  if (!user) {
    return (
      <div style={{ padding: 20, fontSize: 16 }}>
        <h2>TimeOpen 판매자 페이지</h2>
        <OwnerAuthBox />
      </div>
    );
  }

  // 로그인 후: bootstrap 호출 (서버에서 rpc 직접 호출해도 되지만,
  // 지금은 네가 만든 API로 호출하지 않고 바로 rpc 호출해도 OK)
  const { data, error } = await supabase.rpc("bootstrap_owner");

  const row = Array.isArray(data) ? data[0] : data;
  const orgId = row?.organization_id ?? null;
  const handle = row?.handle ?? null;

  if (error || !orgId || !handle) {
    return (
      <div style={{ padding: 20, fontSize: 16 }}>
        <h2>TimeOpen 판매자 페이지</h2>
        <OwnerAuthBox />
        <div style={{ marginTop: 12, color: "#b00020" }}>
          bootstrap 실패: {error?.message ?? "unknown"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <h2>TimeOpen 판매자 페이지</h2>

      {/* 로그인 UI */}
      <OwnerAuthBox />

      {/* 정합성 표시 */}
      <div style={{ marginTop: 14, fontSize: 13, color: "#111" }}>
        <div>organizationId: {orgId}</div>
        <div>handle: {handle}</div>
      </div>

      <div style={{ marginTop: 20 }}>
        <a href="/settings/availability">영업시간 설정으로 이동</a>
      </div>

      <div style={{ marginTop: 12 }}>
        <a href={`/reservations?handle=${handle}`}>예약 확인 (Debug View)</a>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 6 }}>고객 예약 링크:</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <code id="booking-link-text" data-handle={handle}>
            /u/{handle}
          </code>

          <button
            id="copy-booking-link"
            type="button"
            style={{
              fontSize: 13,
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#111",
              cursor: "pointer",
            }}
          >
            복사
          </button>

          <span id="copy-status" style={{ fontSize: 12, color: "#111" }} aria-live="polite" />
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
      var handle = textEl.getAttribute("data-handle") || "";
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