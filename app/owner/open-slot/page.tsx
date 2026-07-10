export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import OpenSlotShareCard from "@/app/owner/OpenSlotShareCard";
import OwnerWhatsNewPopup from "@/app/owner/OwnerWhatsNewPopup";
import { normalizeLinkTheme } from "@/features/booking/themes";
import { getOwnerContext } from "@/lib/owner/getOwnerContext";
import { getBookingUrl } from "@/lib/siteUrl";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSeoulTodayISO() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function OpenSlotPage() {
  const { user, organizationId, handle, error } = await getOwnerContext();

  if (!user) redirect("/login");
  if (error || !organizationId) redirect("/onboarding?setup=retry");

  const supabase = await createSupabaseServerClient();
  const { data: organization } = await supabase
    .from("organizations")
    .select("name, handle, link_theme")
    .eq("id", organizationId)
    .maybeSingle();

  const finalHandle = organization?.handle ?? handle;
  const canLink =
    typeof finalHandle === "string" &&
    finalHandle.trim().length > 0 &&
    finalHandle !== "null";

  return (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <OwnerWhatsNewPopup />
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-5 sm:px-6 sm:pb-9 sm:pt-7">
          <header className="mb-5">
            <a
              href="/owner"
              className="brand-text mb-3 inline-flex min-h-11 items-center text-sm font-bold"
            >
              ← 대시보드
            </a>
            <h1 className="text-3xl font-black tracking-[-0.04em]">빈 시간 공유</h1>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              예약 가능한 시간을 메시지와 스토리 이미지로 만들어보세요.
            </p>
          </header>

          <OpenSlotShareCard
            todayISO={getSeoulTodayISO()}
            bookingUrl={canLink ? getBookingUrl(String(finalHandle)) : ""}
            canLink={canLink}
            storeName={organization?.name?.trim() || "TimeOpen"}
            linkTheme={normalizeLinkTheme(organization?.link_theme)}
          />
        </div>
      </div>
    </main>
  );
}
