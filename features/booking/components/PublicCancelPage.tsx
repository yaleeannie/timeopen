"use client";

import Link from "next/link";
import {
  BookingLanguageSelect,
  PublicBookingI18nProvider,
  usePublicBookingI18n,
} from "./PublicBookingI18n";

function PublicCancelPageContent({ handle }: { handle: string }) {
  const { t } = usePublicBookingI18n();

  return (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-8 text-center sm:px-6 sm:pb-9 sm:pt-10">
          <div className="mb-3 flex justify-end">
            <BookingLanguageSelect />
          </div>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef9fb] text-3xl font-black text-[#4d9caf]">
            ···
          </div>
          <div className="mt-5 text-sm font-bold text-[#00a7df]">TimeOpen</div>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">{t("cancelComingSoon")}</h1>
          <p className="mt-3 text-sm leading-6 text-gray-500">{t("cancelUnavailable")}</p>

          <div className="glass-card mt-6 rounded-[24px] p-5 text-left">
            <div className="text-base font-black">{t("guide")}</div>
            <p className="mt-2 text-sm leading-6 text-gray-500">{t("contactStore")}</p>
          </div>

          <Link
            href={`/u/${handle}`}
            className="brand-button mt-5 flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-base font-black"
          >
            {t("backToBooking")}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PublicCancelPage({ handle }: { handle: string }) {
  return (
    <PublicBookingI18nProvider>
      <PublicCancelPageContent handle={handle} />
    </PublicBookingI18nProvider>
  );
}
