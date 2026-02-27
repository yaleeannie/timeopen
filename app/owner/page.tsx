// app/owner/page.tsx
import { fetchOrganizationByHandle } from "@/features/organizations/fetchOrganizationByHandle";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function OwnerPage() {
  const org = await fetchOrganizationByHandle("demo");

  if (!org) {
    return <div style={{ padding: 20 }}>organization not found for handle=demo</div>;
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const handle = org.handle;

  return (
    <div style={{ padding: 20, fontSize: 16 }}>
      <h2>TimeOpen 판매자 페이지</h2>

      {/* 로그인 상태 안내 */}
      <div style={{ marginTop: 8, color: "#666" }}>
        {user ? (
          <div>
            로그인됨: <b>{user.email}</b>
          </div>
        ) : (
          <div>로그인이 필요합니다.</div>
        )}
      </div>

      {/* 로그인 박스 (로그인 전만 보이게) */}
      {!user && (
        <div
          style={{
            marginTop: 14,
            padding: 14,
            border: "1px solid #eee",
            borderRadius: 12,
            maxWidth: 560,
          }}
        >
          <div style={{ fontSize: 13, color: "#666", marginBottom: 10 }}>
            owner 기능은 로그인 후 사용 가능해요.
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              id="owner-email"
              type="email"
              placeholder="email@example.com"
              style={{
                flex: 1,
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 10,
                fontSize: 16,
              }}
              defaultValue=""
            />

            <button
              id="owner-login"
              type="button"
              style={{
                fontSize: 16,
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #111",
                background: "#111",
                color: "white",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              로그인
            </button>
          </div>

          <div
            id="owner-login-status"
            style={{ marginTop: 10, fontSize: 13, color: "#666" }}
            aria-live="polite"
          />
        </div>
      )}

      {/* 로그아웃 (로그인 후만 보이게) */}
      {user && (
        <div style={{ marginTop: 14 }}>
          <button
            id="owner-logout"
            type="button"
            style={{
              fontSize: 14,
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "white",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
          <span
            id="owner-logout-status"
            style={{ marginLeft: 10, fontSize: 12, color: "#666" }}
            aria-live="polite"
          />
        </div>
      )}

      {/* 정합성 표시 */}
      <div style={{ marginTop: 18, fontSize: 13, color: "#666" }}>
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

          <button
            id="copy-booking-link"
            type="button"
            style={{ fontSize: 13, padding: "4px 8px" }}
          >
            복사
          </button>

          <span id="copy-status" style={{ fontSize: 12, color: "#666" }} aria-live="polite" />
        </div>
      </div>

      {/* inline script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(async function () {
  // --- booking link copy ---
  var btn = document.getElementById("copy-booking-link");
  var textEl = document.getElementById("booking-link-text");
  var status = document.getElementById("copy-status");
  if (btn && textEl) {
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
  }

  // --- login / logout ---
  // (중요) anon key 기반 auth만 사용. 메일 링크 눌렀을 때 /owner로 돌아오게 redirectTo 설정.
  var loginBtn = document.getElementById("owner-login");
  var emailInput = document.getElementById("owner-email");
  var loginStatus = document.getElementById("owner-login-status");

  var logoutBtn = document.getElementById("owner-logout");
  var logoutStatus = document.getElementById("owner-logout-status");

  // supabase-js는 client bundle에서만 쓸 수 있어서, 여기서는 "전용 API"로 호출한다.
  // => /api/auth/magic-link , /api/auth/logout 엔드포인트가 이미 있으면 그걸 쓰고,
  // 없으면 아래 fetch 대상 경로만 너 프로젝트에 맞게 바꿔줘.
  // (너가 이미 만들었던 auth 라우트가 있으면 그걸로 연결하면 됨)

  if (loginBtn && emailInput) {
    loginBtn.addEventListener("click", async function () {
      var email = (emailInput.value || "").trim();
      if (!email) {
        if (loginStatus) loginStatus.textContent = "이메일을 입력해줘.";
        return;
      }

      // 버튼 2번 클릭 방지
      loginBtn.disabled = true;
      loginBtn.style.opacity = "0.6";
      loginBtn.textContent = "전송중...";

      try {
        var res = await fetch("/api/auth/magic-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, redirectTo: window.location.origin + "/owner" })
        });

        var json = await res.json();
        if (!res.ok) throw new Error(json?.error || "로그인 링크 전송 실패");

        if (loginStatus) loginStatus.textContent = "메일함에서 로그인 링크를 눌러줘!";
        loginBtn.textContent = "보냄";
      } catch (e) {
        if (loginStatus) loginStatus.textContent = (e && e.message) ? e.message : "오류가 발생했어.";
        loginBtn.disabled = false;
        loginBtn.style.opacity = "1";
        loginBtn.textContent = "로그인";
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      logoutBtn.disabled = true;
      logoutBtn.style.opacity = "0.6";

      try {
        var res = await fetch("/api/auth/logout", { method: "POST" });
        if (!res.ok) throw new Error("로그아웃 실패");
        if (logoutStatus) logoutStatus.textContent = "로그아웃 됐어. 새로고침 중...";
        setTimeout(function () { window.location.reload(); }, 400);
      } catch (e) {
        if (logoutStatus) logoutStatus.textContent = "로그아웃 오류";
        logoutBtn.disabled = false;
        logoutBtn.style.opacity = "1";
      }
    });
  }
})();`,
        }}
      />
    </div>
  );
}