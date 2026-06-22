"use client";

import BookingScreen from "./BookingScreen";
import {
  BookingLanguageSelect,
  PublicBookingI18nProvider,
  usePublicBookingI18n,
} from "./PublicBookingI18n";

function PublicBookingPageContent({ handle }: { handle: string }) {
  const { t } = usePublicBookingI18n();

  return (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8">
          <div className="mb-3 flex justify-end">
            <BookingLanguageSelect />
          </div>
          <header className="mb-6 text-center">
            <div className="brand-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] text-2xl font-black text-white shadow-[0_12px_26px_rgba(0,193,255,0.22)]">T</div>
            <div className="brand-text mt-4 text-sm font-bold">TimeOpen</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">{t("book")}</h1>
            <p className="mt-2 text-sm leading-5 text-gray-500">{t("bookingSubtitle")}</p>
          </header>

          <BookingScreen handle={handle} />
        </div>
      </div>
    </main>
  );
}

export default function PublicBookingPage({ handle }: { handle: string }) {
  return (
    <PublicBookingI18nProvider>
      <PublicBookingPageContent handle={handle} />
    </PublicBookingI18nProvider>
  );
}
