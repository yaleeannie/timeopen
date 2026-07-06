import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const callbackRoute = readFileSync(
  new URL("../../app/auth/callback/route.ts", import.meta.url),
  "utf8"
);
const signupPage = readFileSync(new URL("../../app/signup/page.tsx", import.meta.url), "utf8");
const loginPage = readFileSync(new URL("../../app/login/page.tsx", import.meta.url), "utf8");
const supabaseClient = readFileSync(
  new URL("../../lib/supabase/client.ts", import.meta.url),
  "utf8"
);

test("auth callback exchanges code-based Supabase links", () => {
  assert.match(callbackRoute, /url\.searchParams\.get\("code"\)/);
  assert.match(callbackRoute, /exchangeCodeForSession\(code\)/);
});

test("auth callback verifies token_hash email confirmation links", () => {
  assert.match(callbackRoute, /url\.searchParams\.get\("token_hash"\)/);
  assert.match(callbackRoute, /normalizeOtpType\(url\.searchParams\.get\("type"\)\)/);
  assert.match(callbackRoute, /verifyOtp\(\{/);
  assert.match(callbackRoute, /token_hash: tokenHash/);
  assert.match(callbackRoute, /type: otpType/);
});

test("auth callback can retry signup token_hash verification as email type", () => {
  assert.match(callbackRoute, /otpType !== "signup"/);
  assert.match(callbackRoute, /type: "email"/);
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
  assert.match(
    loginPage,
    /이메일 인증 링크가 만료되었거나 이미 사용되었을 수 있어요\. 새 인증 메일을 다시 받아주세요\./
  );
  assert.match(loginPage, /회원가입 다시 시도하기/);
});

test("auth callback handles Supabase error params before session exchange", () => {
  assert.match(callbackRoute, /url\.searchParams\.has\("error"\)/);
  assert.match(callbackRoute, /url\.searchParams\.has\("error_code"\)/);
  assert.match(callbackRoute, /provider returned error/);
});

test("auth callback diagnostics do not log raw code, token hash, or full URLs", () => {
  assert.match(callbackRoute, /hasCode: url\.searchParams\.has\("code"\)/);
  assert.match(callbackRoute, /hasTokenHash: url\.searchParams\.has\("token_hash"\)/);
  assert.match(callbackRoute, /process\.env\.NODE_ENV === "production"/);
  assert.doesNotMatch(callbackRoute, /console\[[^\]]+\]\([^)]*code[^)]*\)/);
  assert.doesNotMatch(callbackRoute, /console\[[^\]]+\]\([^)]*tokenHash[^)]*\)/);
  assert.doesNotMatch(callbackRoute, /url\.toString\(\)/);
});

test("signup uses the auth callback redirect URL", () => {
  assert.match(signupPage, /getSignupCallbackOrigin/);
  assert.match(signupPage, /new URL\("\/auth\/callback", callbackOrigin\)/);
  assert.match(signupPage, /callbackUrl\.searchParams\.set\("next", "\/onboarding"\)/);
  assert.match(signupPage, /callbackUrl\.searchParams\.set\("flow", "signup"\)/);
  assert.match(signupPage, /emailRedirectTo: callbackUrl\.toString\(\)/);
});

test("browser Supabase client uses PKCE code flow for email callbacks", () => {
  assert.match(supabaseClient, /flowType: "pkce"/);
});

test("password login remains the primary login path", () => {
  assert.match(loginPage, /signInWithPassword\(\{/);
  assert.match(loginPage, /이메일과 비밀번호로 로그인해 주세요\./);
  assert.match(loginPage, /loading \? "로그인 중\.\.\." : "로그인"/);
});
