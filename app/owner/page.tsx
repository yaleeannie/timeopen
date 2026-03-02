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

  // 로그인 전
  if (userErr || !user) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <header style={styles.header}>
            <div style={styles.brand}>TimeOpen</div>
            <div style={styles.subtitle}>판매자 대시보드</div>
          </header>

          <section style={styles.card}>
            <div style={styles.cardTitle}>로그인</div>
            <div style={styles.cardDesc}>owner 기능은 로그인 후 사용 가능해요.</div>
            <OwnerAuthBox />
          </section>
        </div>
      </main>
    );
  }

  // 로그인 후: org/handle 자동 생성(멱등)
  const { data: boot, error: bootErr } = await supabase.rpc("bootstrap_owner");
  const row = Array.isArray(boot) ? boot[0] : boot;
  const orgId = row?.organization_id ?? null;
  const handle = row?.handle ?? null;

  const bookingPath = handle ? `/u/${handle}` : null;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.brand}>TimeOpen</div>
          <div style={styles.subtitle}>판매자 대시보드</div>
        </header>

        {/* 상단 로그인 카드 */}
        <section style={styles.card}>
          <div style={styles.rowBetween}>
            <div>
              <div style={styles.cardTitle}>계정</div>
              <div style={styles.cardDesc}>로그인/로그아웃 및 상태 확인</div>
            </div>
            <div style={styles.badge}>로그인됨</div>
          </div>

          <OwnerAuthBox />

          <div style={styles.meta}>
            <div>
              <span style={styles.metaLabel}>user</span> {user.email ?? "-"}
            </div>
            <div>
              <span style={styles.metaLabel}>organizationId</span> {orgId ?? "-"}
            </div>
            <div>
              <span style={styles.metaLabel}>handle</span> {handle ?? "-"}
            </div>
            {bootErr ? (
              <div style={{ ...styles.metaError }}>
                bootstrap error: {bootErr.message}
              </div>
            ) : null}
          </div>
        </section>

        {/* 본문 3개 섹션 */}
        <div style={styles.grid}>
          {/* 1) 영업시간 */}
          <section style={styles.card}>
            <div style={styles.cardTitle}>1. 영업시간 설정하기</div>
            <div style={styles.cardDesc}>예약 가능한 요일/시간을 설정해주세요.</div>

            <a href="/settings/availability" style={styles.primaryLink}>
              영업시간 설정으로 이동 →
            </a>
          </section>

          {/* 2) 예약 확인 */}
          <section style={styles.card}>
            <div style={styles.cardTitle}>2. 예약 확인</div>
            <div style={styles.cardDesc}>고객이 만든 예약을 확인하는 곳입니다.</div>

            <a
              href={handle ? `/reservations?handle=${handle}` : "/reservations"}
              style={styles.primaryLink}
            >
              예약 확인으로 이동 →
            </a>
          </section>

          {/* 3) 예약 링크 */}
          <section style={styles.card}>
            <div style={styles.cardTitle}>3. 예약 받는 링크</div>
            <div style={styles.cardDesc}>고객에게 아래 링크를 보내면 바로 예약할 수 있어요.</div>

            {bookingPath ? (
              <>
                <div style={styles.linkBox}>
                  <code id="booking-link-text" style={styles.code}>
                    {bookingPath}
                  </code>

                  <button
                    id="copy-booking-link"
                    type="button"
                    style={styles.copyBtn}
                  >
                    URL 복사
                  </button>
                </div>

                <div id="copy-status" style={styles.copyStatus} aria-live="polite" />

                <div style={{ marginTop: 10 }}>
                  <a
                    href={bookingPath}
                    style={{ ...styles.primaryLink, display: "inline-block" }}
                  >
                    예약 페이지 미리보기 →
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
      var path = (textEl.textContent || "").trim();
      var url = window.location.origin + path;
      await navigator.clipboard.writeText(url);
      if (status) status.textContent = "복사됨 ✅";
      setTimeout(function () { if (status) status.textContent = ""; }, 1200);
    } catch (e) {
      if (status) status.textContent = "복사 실패(권한) ❌";
      setTimeout(function () { if (status) status.textContent = ""; }, 1500);
    }
  });
})();`,
                  }}
                />
              </>
            ) : (
              <div style={{ ...styles.metaError, marginTop: 10 }}>
                handle이 아직 없어요. bootstrap이 실패했을 수 있어요.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    color: "#111",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 860,
    margin: "0 auto",
  },
  header: {
    marginBottom: 16,
  },
  brand: {
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: -0.2,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: 700,
    color: "#555",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
    gap: 14,
    marginTop: 14,
  },
  card: {
    border: "1px solid #e6e6e6",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 900,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: 700,
    color: "#555",
    marginBottom: 12,
    lineHeight: 1.5,
  },
  primaryLink: {
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "underline",
    color: "#111",
  },
  rowBetween: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  badge: {
    fontSize: 12,
    fontWeight: 900,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    whiteSpace: "nowrap",
  },
  meta: {
    marginTop: 10,
    fontSize: 12,
    color: "#666",
    fontWeight: 700,
    lineHeight: 1.7,
  },
  metaLabel: {
    display: "inline-block",
    minWidth: 110,
    color: "#888",
    fontWeight: 800,
  },
  metaError: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 800,
    color: "#b00020",
  },
  linkBox: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  code: {
    display: "inline-block",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #ddd",
    background: "#fafafa",
    color: "#111",
    fontSize: 13,
    fontWeight: 900,
  },
  copyBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 13,
  },
  copyStatus: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 800,
    color: "#111",
    minHeight: 16,
  },
};