export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import LogoutButton from "./LogoutButton";
import SummaryPanel from "./SummaryPanel";

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
  const previewFullLink = finalHandle ? `https://timeopen.app/u/${finalHandle}` : "";
  const canLink = !!finalHandle && finalHandle !== "null";

  const { count: serviceCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("active", true);

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const { count: todayReservationCount } = await supabase
    .from("reservations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("date", todayISO)
    .eq("status", "confirmed");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        color: "#111827",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
              TimeOpen 판매자 대시보드
            </div>

            <div style={{ marginTop: 10, fontSize: 15, color: "#4b5563", lineHeight: 1.6 }}>
              <div>로그인됨: {user.email}</div>
              <div>서비스명: {nameText || "-"}</div>
              <div>예약 링크: {previewPath}</div>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <LogoutButton />
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ marginBottom: 10, fontSize: 18, fontWeight: 900 }}>요약</div>

          <SummaryPanel
            nameText={nameText || "-"}
            todayReservationCount={todayReservationCount ?? 0}
            serviceCount={serviceCount ?? 0}
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
            href="/settings/profile"
            title="기본정보 및 추가정보"
            description="서비스명, 예약 링크, 위치 안내, 예약 안내문을 설정합니다."
          />

          <MenuCard
            href="/settings/services"
            title="서비스 관리"
            description="서비스 추가, 수정, 활성/비활성, 삭제를 관리합니다."
          />

          <MenuCard
            href="/settings/availability"
            title="영업시간 설정"
            description="요일별 운영 시간과 브레이크 시간을 설정합니다."
          />

          <MenuCard
            href={canLink ? `/reservations?handle=${finalHandle}` : "/owner"}
            title="예약 확인"
            description="예약 목록을 확인하고 취소 상태를 관리합니다."
          />

          <MenuCard
            href={canLink ? `/u/${finalHandle}` : "/owner"}
            title="예약 링크 미리보기"
            description="고객이 보게 될 실제 예약 페이지를 확인합니다."
          />
        </div>
      </div>
    </main>
  );
}