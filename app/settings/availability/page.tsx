import AvailabilitySettingsClient from "./AvailabilitySettingsClient";
import { getCurrentOrganizationId } from "../../../features/organizations/getCurrentOrganizationId";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type Props = {
  searchParams: Promise<{ handle?: string }>;
};

export default async function AvailabilitySettingsPage({ searchParams }: Props) {
  const params = await searchParams;
  const handle = (params?.handle ?? "").trim().toLowerCase();

  // 공통 레이아웃(중앙 정렬 + 흰 배경)
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">{children}</div>
    </main>
  );

  // handle이 있으면: handle → organization id 조회
  if (handle) {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("handle", handle)
      .single();

    if (error || !data?.id) {
      return <Shell>존재하지 않는 handle: {handle}</Shell>;
    }

    return (
      <Shell>
        <AvailabilitySettingsClient organizationId={data.id} />
      </Shell>
    );
  }

  // handle이 없으면: 현재 org id로
  const organizationId = await getCurrentOrganizationId();

  return (
    <Shell>
      <AvailabilitySettingsClient organizationId={organizationId} />
    </Shell>
  );
}