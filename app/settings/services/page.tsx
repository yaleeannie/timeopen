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
    <main className="min-h-screen overflow-x-hidden bg-[#eef6f8] px-3 py-4 text-gray-900 sm:px-5 sm:py-7">
      <div className="mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] bg-[#fbfdfe] shadow-[0_20px_60px_rgba(80,145,164,0.14)] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
          <header className="mb-6">
            <a href="/owner" className="mb-3 inline-flex min-h-11 items-center text-sm font-bold text-[#28b9dc]">← 대시보드</a>
            <h1 className="text-3xl font-black tracking-[-0.04em]">서비스 관리</h1>
            <p className="mt-1 text-sm leading-5 text-gray-500">예약 가능한 메뉴와 가격을 관리하세요.</p>
          </header>
          <ServicesEditor organizationId={organizationId} />
          <nav className="mt-7 grid grid-cols-4 gap-1 rounded-2xl border border-[#e5f3f6] bg-white p-2 shadow-sm">
            <a href="/owner" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">대시보드</a>
            <a href="/reservations" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">예약관리</a>
            <a href="/settings/services" className="flex min-h-11 items-center justify-center rounded-xl bg-[#e8f9fd] text-sm font-black text-[#20afd2]">서비스</a>
            <a href="/settings/profile" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">설정</a>
          </nav>
        </div>
      </div>
    </main>
  );
}
