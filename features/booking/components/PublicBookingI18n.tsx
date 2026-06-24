"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BOOKING_LOCALES,
  BOOKING_LOCALE_LABELS,
  isBookingLocale,
  normalizeBookingLocale,
  t,
  type BookingLocale,
} from "@/features/booking/i18n";

const STORAGE_KEY = "timeopen-booking-locale";

type BookingI18nValue = {
  locale: BookingLocale;
  setLocale: (locale: BookingLocale) => void;
  t: (key: Parameters<typeof t>[1], variables?: Parameters<typeof t>[2]) => string;
};

const BookingI18nContext = createContext<BookingI18nValue | null>(null);

export function PublicBookingI18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<BookingLocale>("ko");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isBookingLocale(saved)) {
      setLocaleState(saved);
      return;
    }

    const detected =
      navigator.languages.map(normalizeBookingLocale).find(Boolean) ??
      normalizeBookingLocale(navigator.language);
    setLocaleState(detected);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<BookingI18nValue>(
    () => ({
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        window.localStorage.setItem(STORAGE_KEY, nextLocale);
      },
      t: (key, variables) => t(locale, key, variables),
    }),
    [locale]
  );

  return (
    <BookingI18nContext.Provider value={value}>
      {children}
    </BookingI18nContext.Provider>
  );
}

export function usePublicBookingI18n() {
  const value = useContext(BookingI18nContext);
  if (!value) {
    throw new Error("usePublicBookingI18n must be used inside PublicBookingI18nProvider");
  }
  return value;
}

export function BookingLanguageSelect() {
  const { locale, setLocale } = usePublicBookingI18n();

  return (
    <label className="brand-chip inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold shadow-sm">
      <span>Language</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value as BookingLocale)}
        aria-label="Language"
        className="max-w-[150px] bg-transparent text-xs font-bold text-gray-700 outline-none"
      >
        {BOOKING_LOCALES.map((item) => (
          <option key={item} value={item}>
            {BOOKING_LOCALE_LABELS[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
