export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import ServicesEditor from "@/app/owner/ServicesEditor";

export default async function ServicesSettingsPage() {
  const { user, organizationId, error } = await getOwnerContext();

  if (!user) redirect("/login");

  if (error || !organizationId) {
    redirect("/onboarding?setup=retry");
  }

  return (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
          <header className="mb-6">
            <a href="/owner" className="brand-text mb-3 inline-flex min-h-11 items-center text-sm font-bold">← 대시보드</a>
            <h1 className="text-3xl font-black tracking-[-0.04em]">서비스 관리</h1>
            <p className="mt-1 text-sm leading-5 text-gray-500">고객에게 보여질 서비스, 가격, 소요시간을 관리해요.</p>
          </header>
          <ServicesEditor organizationId={organizationId} />
          <nav className="brand-nav mt-7 grid grid-cols-4 gap-1 rounded-2xl p-2">
            <a href="/owner" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">대시보드</a>
            <a href="/reservations" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">예약관리</a>
            <a href="/settings/services" className="brand-chip flex min-h-11 items-center justify-center rounded-xl text-sm font-black">서비스</a>
            <a href="/settings/profile" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">샵 프로필</a>
          </nav>
        </div>
      </div>
    </main>
  );
}
