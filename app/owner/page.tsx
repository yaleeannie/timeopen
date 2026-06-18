export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import LogoutButton from "./LogoutButton";
import SummaryPanel from "./SummaryPanel";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://timeopen.app").replace(/\/+$/, "");

function getTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentTimeText() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
}

function MenuCard({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <a
      href={href}
      style={{
        display: "block",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 18,
        background: "#fff",
        textDecoration: "none",
        color: "#111827",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>{title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "#6b7280" }}>{description}</div>
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#9ca3af",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          →
        </div>
      </div>
    </a>
  );
}

export default async function OwnerPage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error) {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>TimeOpen 판매자 대시보드</h1>
          <div style={{ color: "#b00020", fontWeight: 800 }}>
            owner 정보를 불러오지 못했습니다: {error}
          </div>
        </div>
      </main>
    );
  }

  if (!organizationId) {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>TimeOpen 판매자 대시보드</h1>
          <div style={{ color: "#b00020", fontWeight: 800 }}>organizationId를 찾을 수 없습니다.</div>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .select("name, handle, location_text, notice_text")
    .eq("id", organizationId)
    .maybeSingle();

  if (orgErr) {
    return (
      <main style={{ minHeight: "100vh", background: "#f9fafb", padding: 24 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 12 }}>TimeOpen 판매자 대시보드</h1>
          <div style={{ color: "#b00020", fontWeight: 800 }}>
            organizations 조회 오류: {orgErr.message}
          </div>
        </div>
      </main>
    );
  }

  const nameText = (orgRow?.name as string | null) ?? "";
  const finalHandle = (orgRow?.handle as string | null) ?? handle;
  const previewPath = finalHandle ? `/u/${finalHandle}` : "-";
  const previewFullLink = finalHandle ? `${SITE_URL}/u/${finalHandle}` : "";
  const canLink = !!finalHandle && finalHandle !== "null";

  const todayISO = getTodayISO();

  const { count: todayReservationCount } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("date", todayISO)
    .eq("status", "confirmed");

  const { data: nextReservationRows } = await supabase
    .from("reservations")
    .select("start_time, customer_name")
    .eq("organization_id", organizationId)
    .eq("date", todayISO)
    .eq("status", "confirmed")
    .gte("start_time", getCurrentTimeText())
    .order("start_time", { ascending: true })
    .limit(1);

  const nextReservation = nextReservationRows?.[0] ?? null;
  const nextReservationTime = nextReservation?.start_time
    ? String(nextReservation.start_time).slice(0, 5)
    : "";
  const nextReservationCustomer = nextReservation?.customer_name
    ? String(nextReservation.customer_name)
    : "";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        color: "#111827",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: "-0.02em",
              }}
            >
              오늘
            </div>

            <div style={{ marginTop: 10, fontSize: 15, color: "#4b5563", lineHeight: 1.6 }}>
              <div>{nameText || "TimeOpen"}</div>
              <div>{todayISO} 예약 현황</div>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <LogoutButton />
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <SummaryPanel
            todayReservationCount={todayReservationCount ?? 0}
            nextReservationTime={nextReservationTime}
            nextReservationCustomer={nextReservationCustomer}
            previewPath={previewPath}
            previewFullLink={previewFullLink}
            canLink={canLink}
            todayISO={todayISO}
          />
        </div>

        <div style={{ marginBottom: 12, fontSize: 18, fontWeight: 900 }}>관리 메뉴</div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          <MenuCard
            href="/owner"
            title="오늘"
            description="오늘 예약과 다음 일정을 확인합니다."
          />

          <MenuCard
            href="/reservations"
            title="예약"
            description="전체 예약을 확인하고 취소 상태를 관리합니다."
          />

          <MenuCard
            href="/settings/services"
            title="서비스"
            description="예약 가능한 서비스를 관리합니다."
          />

          <MenuCard
            href="/settings/profile"
            title="설정"
            description="기본정보와 예약 링크 설정을 관리합니다."
          />
        </div>
      </div>
    </main>
  );
}
