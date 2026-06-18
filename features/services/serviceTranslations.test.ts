import assert from "node:assert/strict";
import test from "node:test";
import {
  getLocalizedServiceName,
  normalizeServiceNameTranslations,
} from "./serviceTranslations";

test("normalizes supported service name translations and removes empty values", () => {
  assert.deepEqual(
    normalizeServiceNameTranslations({
      en: " Haircut ",
      ja: " ",
      ko: "커트",
      unknown: "ignored",
    }),
    { en: "Haircut" }
  );
});

test("uses the selected locale translation and falls back to the base name", () => {
  const translations = { en: "Haircut", ja: "カット" };

  assert.equal(getLocalizedServiceName("커트", translations, "en"), "Haircut");
  assert.equal(getLocalizedServiceName("커트", translations, "ja"), "カット");
  assert.equal(getLocalizedServiceName("커트", translations, "vi"), "커트");
  assert.equal(getLocalizedServiceName("커트", translations, "ko"), "커트");
});
