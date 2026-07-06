import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const callbackRoute = readFileSync(
  new URL("../../app/auth/callback/route.ts", import.meta.url),
  "utf8"
);
const signupPage = readFileSync(new URL("../../app/signup/page.tsx", import.meta.url), "utf8");
const loginPage = readFileSync(new URL("../../app/login/page.tsx", import.meta.url), "utf8");

test("auth callback exchanges code-based Supabase links", () => {
  assert.match(callbackRoute, /url\.searchParams\.get\("code"\)/);
  assert.match(callbackRoute, /exchangeCodeForSession\(code\)/);
});

test("auth callback verifies token_hash email confirmation links", () => {
  assert.match(callbackRoute, /url\.searchParams\.get\("token_hash"\)/);
  assert.match(callbackRoute, /normalizeOtpType\(url\.searchParams\.get\("type"\)\)/);
  assert.match(callbackRoute, /verifyOtp\(\{/);
  assert.match(callbackRoute, /token_hash: tokenHash!/);
  assert.match(callbackRoute, /type: otpType!/);
});

test("signup confirmations redirect to onboarding after callback success", () => {
  assert.match(callbackRoute, /flow === "signup"/);
  assert.match(callbackRoute, /otpType === "signup"/);
  assert.match(callbackRoute, /otpType === "email"/);
  assert.match(callbackRoute, /\? "\/onboarding" : requestedNext/);
});

test("callback failure redirects with a safe login message", () => {
  assert.match(callbackRoute, /message", "email_confirm_failed"/);
  assert.doesNotMatch(callbackRoute, /reason", error\.message/);
  assert.match(loginPage, /이메일 인증 링크를 처리하지 못했어요\. 다시 로그인해 주세요\./);
});

test("signup uses the auth callback redirect URL", () => {
  assert.match(signupPage, /new URL\("\/auth\/callback", callbackOrigin\)/);
  assert.match(signupPage, /callbackUrl\.searchParams\.set\("next", "\/onboarding"\)/);
  assert.match(signupPage, /callbackUrl\.searchParams\.set\("flow", "signup"\)/);
  assert.match(signupPage, /emailRedirectTo: callbackUrl\.toString\(\)/);
});

test("password login remains the primary login path", () => {
  assert.match(loginPage, /signInWithPassword\(\{/);
  assert.match(loginPage, /이메일과 비밀번호로 로그인해 주세요\./);
  assert.match(loginPage, /loading \? "로그인 중\.\.\." : "로그인"/);
});
