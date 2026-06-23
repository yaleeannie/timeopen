"use client";

import type { CSSProperties } from "react";
import BookingScreen from "./BookingScreen";
import {
  BookingLanguageSelect,
  PublicBookingI18nProvider,
  usePublicBookingI18n,
} from "./PublicBookingI18n";
import {
  PUBLIC_BOOKING_THEMES,
  type LinkTheme,
} from "@/features/booking/themes";
import type { BookingSlotMode } from "@/features/booking/slotMode";

type Props = {
  handle: string;
  linkTheme: LinkTheme;
  bookingSlotMode: BookingSlotMode;
  bookingEnabled: boolean;
  shopName?: string;
  locationText?: string;
  noticeText?: string;
};

function PublicBookingPageContent({
  handle,
  linkTheme,
  bookingSlotMode,
  bookingEnabled,
  shopName = "",
  locationText = "",
  noticeText = "",
}: Props) {
  const { locale, t } = usePublicBookingI18n();
  const theme = PUBLIC_BOOKING_THEMES[linkTheme];

  return (
    <main
      className={`${theme.page} overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7`}
      style={theme.variables as CSSProperties}
    >
      <div className={`${theme.shell} mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]`}>
        <div className="px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8">
          <div className="mb-3 flex justify-end">
            <div className="text-right">
              <BookingLanguageSelect />
              {locale === "ko" ? (
                <p className="mt-1 text-[10px] font-medium text-slate-400">
                  다국어 예약 화면은 베타로 제공 중이에요.
                </p>
              ) : null}
            </div>
          </div>
          <header className="mb-6 text-center">
            <div className={`${theme.logo} mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] text-2xl font-black [color:var(--brand-contrast)]`}>T</div>
            <div className="brand-text mt-4 text-sm font-bold">TimeOpen 샵 예약</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">{t("book")}</h1>
            <p className="mt-2 text-sm leading-5 text-gray-500">{t("bookingSubtitle")}</p>
          </header>

          {bookingEnabled ? (
            <BookingScreen handle={handle} bookingSlotMode={bookingSlotMode} />
          ) : (
            <section className="space-y-3.5">
              <div className="glass-card rounded-[24px] px-4 py-5 text-center">
                <div className="text-lg font-black tracking-[-0.025em] text-slate-950">
                  {shopName.trim() || `@${handle}`}
                </div>
                {locationText.trim() ? (
                  <p className="mt-1 whitespace-pre-line text-xs font-medium leading-5 text-slate-500">
                    {locationText.trim()}
                  </p>
                ) : null}
              </div>

              <div className="glass-card rounded-[24px] px-5 py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl brand-soft text-2xl font-black">
                  …
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  지금은 예약을 잠시 받고 있지 않아요.
                </h2>
                <p className="mt-2 text-sm font-medium leading-6 text-gray-500">
                  예약이 다시 열리면 이 링크에서 예약할 수 있어요.
                </p>
                {noticeText.trim() ? (
                  <div className="mt-5 rounded-2xl bg-white/70 px-4 py-3 text-left text-sm font-medium leading-6 text-gray-600">
                    {noticeText.trim()}
                  </div>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

export default function PublicBookingPage(props: Props) {
  return (
    <PublicBookingI18nProvider>
      <PublicBookingPageContent {...props} />
    </PublicBookingI18nProvider>
  );
}
