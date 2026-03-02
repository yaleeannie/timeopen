// app/settings/availability/page.tsx
import type { ReactNode } from "react";
import AvailabilitySettingsClient from "./AvailabilitySettingsClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;

function pickHandle(sp?: SearchParams) {
  const raw = sp?.handle;
  if (!raw) return "";
  if (Array.isArray(raw)) return String(raw[0] ?? "");
  return String(raw);
}

export default async function AvailabilitySettingsPage(props: { searchParams?: SearchParams }) {
  const handle = pickHandle(props.searchParams).trim().toLowerCase();

  const Shell = ({ children }: { children: ReactNode }) => (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">{children}</div>
    </main>
  );

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return (
      <Shell>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>로그인이 필요합니다.</div>
        <div style={{ color: "#444" }}>owner만 영업시간을 설정할 수 있어요.</div>
      </Shell>
    );
  }

  let organizationId: string | null = null;

  if (handle) {
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();

    if (orgErr || !org?.id) {
      return <Shell>존재하지 않는 handle: {handle}</Shell>;
    }

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
          <div style={{ fontWeight: 700, marginBottom: 8 }}>접근 권한이 없습니다.</div>
          <div style={{ color: "#444" }}>해당 organization의 owner가 아니에요.</div>
        </Shell>
      );
    }

    organizationId = org.id;
  } else {
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
          <div style={{ fontWeight: 700 }}>owner로 연결된 organization이 없습니다.</div>
        </Shell>
      );
    }

    organizationId = mem.organization_id;
  }

  if (!organizationId) {
    return <Shell>조직 정보를 불러오지 못했어요.</Shell>;
  }

  return (
    <Shell>
      <AvailabilitySettingsClient organizationId={organizationId} />
    </Shell>
  );
}