import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PUBLIC_BOOKING_THEME,
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
