"use client";

import Link from "next/link";
import {
  BookingLanguageSelect,
  PublicBookingI18nProvider,
  usePublicBookingI18n,
} from "./PublicBookingI18n";
import { getLocalizedServiceName } from "@/features/services/serviceTranslations";

type Props = {
  handle: string;
  dateText: string;
  timeText: string;
  serviceName: string;
  serviceNameTranslations: Record<string, string>;
  customerName: string;
  customerPhone: string;
  locationText: string;
  noticeText: string;
  organizationFound: boolean;
  reservationFound: boolean;
  organizationError?: string;
  reservationError?: string;
};

function PublicConfirmedPageContent(props: Props) {
  const { locale, t } = usePublicBookingI18n();

  return (
    <main className="soft-page-bg overflow-x-hidden px-3 py-4 text-slate-900 sm:px-5 sm:py-7">
      <div className="glass-shell mx-auto w-full min-w-0 max-w-lg overflow-hidden rounded-[28px] sm:rounded-[36px]">
        <div className="px-4 pb-7 pt-6 sm:px-6 sm:pb-9 sm:pt-8">
          <div className="mb-3 flex justify-end">
            <BookingLanguageSelect />
          </div>
          <header className="mb-6 text-center">
            <div className="brand-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black text-white shadow-[0_12px_26px_rgba(0,193,255,0.24)]">
              ✓
            </div>
            <div className="mt-4 text-sm font-bold text-[#00a7df]">{t("bookingComplete")}</div>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em]">{t("bookingConfirmed")}</h1>
            <p className="mt-2 text-sm leading-5 text-gray-500">{t("checkBookingInfo")}</p>
          </header>

          <section className="brand-gradient rounded-[24px] p-5 text-white shadow-[0_14px_30px_rgba(0,193,255,0.22)]">
            <div className="grid grid-cols-2 gap-4">
              <div className="min-w-0">
                <div className="text-sm font-bold text-cyan-50">{t("reservationDate")}</div>
                <div className="mt-1 break-words text-lg font-black [overflow-wrap:anywhere]">
                  {props.dateText}
                </div>
              </div>
              <div className="min-w-0 text-right">
                <div className="text-sm font-bold text-cyan-50">{t("reservationTime")}</div>
                <div className="mt-1 break-words text-lg font-black [overflow-wrap:anywhere]">
                  {props.timeText}
                </div>
              </div>
            </div>
            <div className="my-4 h-px bg-white/20" />
            <div>
              <div className="text-sm font-bold text-cyan-50">{t("service")}</div>
              <div className="mt-1 break-words text-xl font-black [overflow-wrap:anywhere]">
                {getLocalizedServiceName(
                  props.serviceName,
                  props.serviceNameTranslations,
                  locale
                )}
              </div>
            </div>
          </section>

          <section className="glass-card mt-4 rounded-[24px] p-4">
            <div className="mb-3 text-base font-black">{t("customerInfo")}</div>
            <div className="grid gap-3">
              <div className="flex min-w-0 items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-400">{t("name")}</span>
                <span className="min-w-0 break-words text-right text-sm font-bold [overflow-wrap:anywhere]">
                  {props.customerName}
                </span>
              </div>
              <div className="flex min-w-0 items-start justify-between gap-4">
                <span className="shrink-0 text-sm text-gray-400">{t("phone")}</span>
                <span className="min-w-0 break-words text-right text-sm font-bold [overflow-wrap:anywhere]">
                  {props.customerPhone}
                </span>
              </div>
            </div>
          </section>

          <section className="glass-card mt-4 rounded-[24px] p-4">
            <div className="mb-4 text-base font-black">{t("visitorGuide")}</div>
            <div className="mb-4">
              <div className="text-sm font-bold text-[#00a7df]">{t("location")}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">
                {props.locationText || "-"}
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-[#00a7df]">{t("bookingNotice")}</div>
              <div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600 [overflow-wrap:anywhere]">
                {props.noticeText || "-"}
              </div>
            </div>
          </section>

          {!props.organizationFound ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 [overflow-wrap:anywhere]">
              {t("organizationNotFound")} {props.organizationError ? `(${props.organizationError})` : ""}
            </div>
          ) : null}

          {!props.reservationFound ? (
            <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 [overflow-wrap:anywhere]">
              {t("reservationNotFound")} {props.reservationError ? `(${props.reservationError})` : ""}
            </div>
          ) : null}

          <Link
            href={`/u/${props.handle}`}
            className="brand-button mt-5 flex min-h-11 w-full items-center justify-center rounded-xl px-4 py-3 text-base font-black"
          >
            {t("backToBooking")}
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function PublicConfirmedPage(props: Props) {
  return (
    <PublicBookingI18nProvider>
      <PublicConfirmedPageContent {...props} />
    </PublicBookingI18nProvider>
  );
}
