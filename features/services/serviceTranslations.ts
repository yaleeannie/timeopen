import type { BookingLocale } from "@/features/booking/i18n";

export const SERVICE_TRANSLATION_LOCALES = [
  "en",
  "ja",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "vi",
  "th",
] as const;

export type ServiceTranslationLocale = (typeof SERVICE_TRANSLATION_LOCALES)[number];
export type ServiceNameTranslations = Partial<Record<ServiceTranslationLocale, string>>;

export const SERVICE_TRANSLATION_LABELS: Record<ServiceTranslationLocale, string> = {
  en: "English",
  ja: "日本語",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文（台灣）",
  "zh-HK": "繁體中文（香港）",
  vi: "Tiếng Việt",
  th: "ไทย",
};

export function normalizeServiceNameTranslations(
  value: unknown
): ServiceNameTranslations {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const source = value as Record<string, unknown>;
  const result: ServiceNameTranslations = {};

  for (const locale of SERVICE_TRANSLATION_LOCALES) {
    const name = source[locale];
    if (typeof name === "string" && name.trim()) {
      result[locale] = name.trim();
    }
  }

  return result;
}

export function getLocalizedServiceName(
  name: string,
  translations: unknown,
  locale: BookingLocale
) {
  if (locale === "ko") return name;
  return normalizeServiceNameTranslations(translations)[locale]?.trim() || name;
}
