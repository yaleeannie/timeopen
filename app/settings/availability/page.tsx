// app/settings/availability/page.tsx
import AvailabilitySettingsClient from "./AvailabilitySettingsClient";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type Props = {
  searchParams: Promise<{ handle?: string }>;
};

export default async function AvailabilitySettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const handle = (params?.handle ?? "").trim().toLowerCase();

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">{children}</div>
    </main>
  );

  const supabase = createSupabaseServerClient();

  // ✅ 1) 로그인 필수
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return (
      <Shell>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>로그인이 필요합니다.</div>
        <div style={{ color: "#666" }}>owner만 영업시간을 설정할 수 있어요.</div>
      </Shell>
    );
  }

  // ✅ 2) org 선택
  let organizationId: string | null = null;

  if (handle) {
    // handle -> org
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();

    if (orgErr || !org?.id) {
      return <Shell>존재하지 않는 handle: {handle}</Shell>;
    }

    // ✅ 3) membership 검증 (handle을 신뢰하지 않음)
    const { data: m, error: mErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", org.id)
      .eq("user_id", user.id)
      .eq("role", "owner")
      .maybeSingle();

    if (mErr || !m) {
      return (
        <Shell>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>접근 권한이 없습니다.</div>
          <div style={{ color: "#666" }}>해당 organization의 owner가 아니에요.</div>
        </Shell>
      );
    }

    organizationId = org.id;
  } else {
    // handle 없으면: 내가 owner인 첫 org
    const { data: mem, error: memErr } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();

    if (memErr || !mem?.organization_id) {
      return (
        <Shell>
          <div>owner로 연결된 organization이 없습니다.</div>
        </Shell>
      );
    }

    organizationId = mem.organization_id;
  }

  return (
    <Shell>
      <AvailabilitySettingsClient organizationId={organizationId} />
    </Shell>
  );
}