export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import ProfileEditor from "@/app/owner/ProfileEditor";
import { normalizeLinkTheme } from "@/features/booking/themes";

export default async function ProfilePage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) {
    redirect("/login");
  }

  if (error || !organizationId) {
    redirect("/onboarding?setup=retry");
  }

  const supabase = await createSupabaseServerClient();

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("name, handle, location_text, notice_text, link_theme")
    .eq("id", organizationId)
    .maybeSingle();

  return (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
          <header className="mb-6">
            <a href="/owner" className="brand-text mb-3 inline-flex min-h-11 items-center text-sm font-bold">← 대시보드</a>
            <h1 className="text-3xl font-black tracking-[-0.04em]">샵 프로필</h1>
            <p className="mt-1 text-sm leading-5 text-gray-500">인스타 예약 페이지에 보일 샵 정보와 안내를 관리하세요.</p>
          </header>
          <ProfileEditor
            organizationId={organizationId}
            initialName={orgRow?.name ?? ""}
            initialHandle={orgRow?.handle ?? ""}
            initialLocation={orgRow?.location_text ?? ""}
            initialNotice={orgRow?.notice_text ?? ""}
            initialTheme={normalizeLinkTheme(orgRow?.link_theme)}
          />
          <nav className="brand-nav mt-7 grid grid-cols-4 gap-1 rounded-2xl p-2">
            <a href="/owner" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">대시보드</a>
            <a href="/reservations" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">예약관리</a>
            <a href="/settings/services" className="flex min-h-11 items-center justify-center rounded-xl text-sm font-bold text-gray-500">서비스</a>
            <a href="/settings/profile" className="brand-chip flex min-h-11 items-center justify-center rounded-xl text-sm font-black">샵 프로필</a>
          </nav>
        </div>
      </div>
    </main>
  );
}
