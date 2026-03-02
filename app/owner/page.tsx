// app/owner/page.tsx
export const dynamic = "force-dynamic";

import OwnerAuthBox from "./OwnerAuthBox";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerPage() {
  const supabase = await createSupabaseServerClient();

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

  const { data: boot, error: bootErr } = await supabase.rpc("bootstrap_owner");
  const row = Array.isArray(boot) ? boot[0] : boot;

  // ✅ 네 DB 함수가 out_*로 바뀐 버전일 때
  const orgId = row?.out_organization_id ?? null;
  const handle = row?.out_handle ?? null;

  const bookingPath = `/u/${handle ?? ""}`;

  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <h2 style={{ marginBottom: 12 }}>TimeOpen 판매자 페이지</h2>

      <OwnerAuthBox />

      {/* 디버그(원하면 나중에 숨겨도 됨) */}
      <div style={{ marginTop: 14, fontSize: 13, color: "#444" }}>
        <div>user: {user.email}</div>
        <div>organizationId: {orgId ?? "-"}</div>
        <div>handle: {handle ?? "-"}</div>
        {bootErr ? <div style={{ color: "#b00020" }}>bootstrap error: {bootErr.message}</div> : null}
      </div>

      {!handle ? (
        <div style={{ marginTop: 18, color: "#b00020", fontWeight: 800 }}>
          handle이 아직 없어요. bootstrap이 실패했을 수 있어요.
        </div>
      ) : (
        <>
          {/* 1) 영업시간 설정 */}
          <section style={{ marginTop: 26, paddingTop: 18, borderTop: "1px solid #eee" }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>1. 영업시간 설정하기</div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>영업시간을 설정해주세요</div>
            <a href="/settings/availability" style={{ textDecoration: "underline", fontWeight: 700 }}>
              영업시간 설정으로 이동
            </a>
          </section>

          {/* 2) 예약 확인 */}
          <section style={{ marginTop: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>2. 예약 확인</div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>예약을 확인하는 곳 입니다.</div>
            <a href="/reservations" style={{ textDecoration: "underline", fontWeight: 700 }}>
              예약 확인으로 이동
            </a>
          </section>

          {/* 3) 예약 링크 + 복사 */}
          <section style={{ marginTop: 22 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 6 }}>3. 예약 받는 예약링크</div>
            <div style={{ fontSize: 13, color: "#444", marginBottom: 10 }}>아래 링크를 복사해서 고객에게 보내주세요.</div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
              <code
                id="booking-link-text"
                data-handle={handle}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid #eee",
                  background: "#fafafa",
                  fontWeight: 800,
                }}
              >
                {bookingPath}
              </code>

              <button
                id="copy-booking-link"
                type="button"
                style={{
                  fontSize: 13,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid #111",
                  background: "#111",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                URL 복사하기
              </button>

              <span id="copy-status" style={{ fontSize: 12, color: "#111" }} aria-live="polite" />
            </div>

            <div style={{ marginTop: 10 }}>
              <a href={bookingPath} style={{ textDecoration: "underline", fontSize: 13, fontWeight: 700 }}>
                예약 페이지 미리보기
              </a>
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
          </section>
        </>
      )}
    </div>
  );
}