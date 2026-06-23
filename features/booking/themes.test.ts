import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PUBLIC_BOOKING_THEME,
  PUBLIC_BOOKING_THEMES,
  isLinkTheme,
  normalizeLinkTheme,
} from "./themes";

test("accepts only supported booking link themes", () => {
  assert.equal(isLinkTheme("minimal"), true);
  assert.equal(isLinkTheme("beauty"), true);
  assert.equal(isLinkTheme("simple"), true);
  assert.equal(isLinkTheme("glow"), true);
  assert.equal(isLinkTheme("dark"), false);
  assert.equal(isLinkTheme(null), false);
});

test("falls back to glow for missing or invalid themes", () => {
  assert.equal(normalizeLinkTheme(null), DEFAULT_PUBLIC_BOOKING_THEME);
  assert.equal(normalizeLinkTheme("unknown"), DEFAULT_PUBLIC_BOOKING_THEME);
  assert.equal(normalizeLinkTheme("beauty"), "beauty");
});

test("uses polished beta labels and solid theme accents", () => {
  assert.equal(PUBLIC_BOOKING_THEMES.minimal.label, "미니멀");
  assert.equal(PUBLIC_BOOKING_THEMES.beauty.label, "뷰티");
  assert.equal(PUBLIC_BOOKING_THEMES.simple.label, "톡톡");
  assert.equal(PUBLIC_BOOKING_THEMES.glow.label, "글로우");
  assert.equal(PUBLIC_BOOKING_THEMES.minimal.variables["--brand-primary"], "#111111");
  assert.equal(PUBLIC_BOOKING_THEMES.beauty.variables["--brand-primary"], "#FF69B4");
  assert.equal(PUBLIC_BOOKING_THEMES.simple.variables["--brand-primary"], "#FFBF00");
  assert.equal(PUBLIC_BOOKING_THEMES.simple.variables["--brand-contrast"], "#111111");
});
