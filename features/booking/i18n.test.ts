import assert from "node:assert/strict";
import test from "node:test";
import { normalizeBookingLocale, t } from "./i18n";

test("maps supported browser languages to booking locales", () => {
  assert.equal(normalizeBookingLocale("ko-KR"), "ko");
  assert.equal(normalizeBookingLocale("en-US"), "en");
  assert.equal(normalizeBookingLocale("ja-JP"), "ja");
  assert.equal(normalizeBookingLocale("zh-CN"), "zh-CN");
  assert.equal(normalizeBookingLocale("zh-SG"), "zh-CN");
  assert.equal(normalizeBookingLocale("zh-TW"), "zh-TW");
  assert.equal(normalizeBookingLocale("zh-HK"), "zh-HK");
  assert.equal(normalizeBookingLocale("zh-MO"), "zh-HK");
  assert.equal(normalizeBookingLocale("vi-VN"), "vi");
  assert.equal(normalizeBookingLocale("th-TH"), "th");
});

test("falls back to English for unsupported browser languages", () => {
  assert.equal(normalizeBookingLocale("fr-FR"), "en");
});

test("returns translated fixed UI copy", () => {
  assert.equal(t("ko", "next"), "다음");
  assert.equal(t("en", "next"), "Next");
  assert.equal(t("ja", "next"), "次へ");
  assert.equal(t("zh-CN", "next"), "下一步");
  assert.equal(t("zh-TW", "next"), "下一步");
  assert.equal(t("zh-HK", "next"), "下一步");
  assert.equal(t("vi", "next"), "Tiếp theo");
  assert.equal(t("th", "next"), "ถัดไป");
});
