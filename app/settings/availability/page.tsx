export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AvailabilityManagementClient from "./AvailabilityManagementClient";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function AvailabilitySettingsPage() {
  const Shell = ({ children }: { children: ReactNode }) => (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">{children}</div>
      </div>
    </main>
  );

  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error || !organizationId) {
    redirect("/onboarding?setup=retry");
  }

  const supabase = await createSupabaseServerClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("booking_slot_mode, booking_slot_interval_min")
    .eq("id", organizationId)
    .maybeSingle();

  return (
    <Shell>
      <header className="mb-6">
        <a href="/owner" className="brand-text mb-3 inline-flex min-h-11 items-center text-sm font-bold">← 대시보드</a>
        <h1 className="text-3xl font-black tracking-[-0.04em]">영업시간 관리</h1>
        <p className="mt-1 text-sm leading-5 text-gray-500">
          고객이 예약할 수 있는 시간과 휴무일을 요일별로 설정할 수 있어요.
        </p>
        <p className="mt-2 truncate text-sm text-gray-400">@{handle ?? "-"}</p>
      </header>
      <AvailabilityManagementClient
        organizationId={organizationId}
        initialBookingSlotMode={organization?.booking_slot_mode}
        initialBookingSlotIntervalMin={organization?.booking_slot_interval_min}
      />
      <nav className="brand-nav mt-7 grid grid-cols-4 gap-1 rounded-2xl p-2">
        <a href="/owner" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">대시보드</a>
        <a href="/reservations" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">예약관리</a>
        <a href="/settings/services" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">서비스</a>
        <a href="/settings/profile" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">샵 프로필</a>
      </nav>
    </Shell>
  );
}
