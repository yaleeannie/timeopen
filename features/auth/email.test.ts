import assert from "node:assert/strict";
import test from "node:test";

import { normalizeEmail, validateEmail } from "./email";

test("accepts normal Korean and custom domain email providers", () => {
  for (const email of [
    "user@naver.com",
    "user@kakao.com",
    "user@daum.net",
    "user@nate.com",
    "owner@shop.co.kr",
    "user@gmail.com",
    "hello@timeopen.app",
  ]) {
    assert.equal(validateEmail(email).ok, true, email);
  }
});

test("normalizes email by trimming and lowercasing", () => {
  assert.deepEqual(validateEmail(" Owner@Shop.Co.Kr "), {
    ok: true,
    value: "owner@shop.co.kr",
  });
  assert.equal(normalizeEmail(" USER@NAVER.COM "), "user@naver.com");
});

test("rejects malformed email addresses", () => {
  for (const email of [
    "invalid text",
    "missing-at.com",
    "user@",
    "user@domain",
    "user name@example.com",
    "@example.com",
  ]) {
    assert.equal(validateEmail(email).ok, false, email);
  }
});
