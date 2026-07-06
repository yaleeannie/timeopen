import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const forgotPasswordPage = readFileSync(
  new URL("../../app/forgot-password/page.tsx", import.meta.url),
  "utf8"
);
const resetPasswordPage = readFileSync(
  new URL("../../app/reset-password/page.tsx", import.meta.url),
  "utf8"
);
const callbackRoute = readFileSync(
  new URL("../../app/auth/callback/route.ts", import.meta.url),
  "utf8"
);
const loginPage = readFileSync(new URL("../../app/login/page.tsx", import.meta.url), "utf8");

test("forgot password sends recovery email through auth callback to reset-password", () => {
  assert.match(forgotPasswordPage, /new URL\("\/auth\/callback", getPasswordResetCallbackOrigin\(\)\)/);
  assert.match(forgotPasswordPage, /callbackUrl\.searchParams\.set\("next", "\/reset-password"\)/);
  assert.match(forgotPasswordPage, /callbackUrl\.searchParams\.set\("flow", "recovery"\)/);
  assert.match(forgotPasswordPage, /redirectTo: callbackUrl\.toString\(\)/);
  assert.doesNotMatch(forgotPasswordPage, /next=\/auth\/reset/);
});

test("auth callback supports recovery token_hash links", () => {
  assert.match(callbackRoute, /"recovery"/);
  assert.match(callbackRoute, /verifyTokenHash\(supabase, tokenHash!, otpType!\)/);
  assert.match(callbackRoute, /safeNext\(url\.searchParams\.get\("next"\)\)/);
});

test("reset-password page validates session and shows safe invalid-link copy", () => {
  assert.match(resetPasswordPage, /getSession\(\)/);
  assert.match(
    resetPasswordPage,
    /비밀번호 재설정 링크가 만료되었거나 유효하지 않아요\. 다시 요청해주세요\./
  );
  assert.match(resetPasswordPage, /href="\/forgot-password"/);
  assert.match(resetPasswordPage, /href="\/login"/);
});

test("reset-password page validates password and confirmation", () => {
  assert.match(resetPasswordPage, /password\.length < 8/);
  assert.match(resetPasswordPage, /비밀번호를 8자 이상으로 입력해주세요\./);
  assert.match(resetPasswordPage, /password !== passwordConfirm/);
  assert.match(resetPasswordPage, /비밀번호가 서로 다릅니다\./);
});

test("reset-password page updates password and shows success login guidance", () => {
  assert.match(resetPasswordPage, /updateUser\(\{ password \}\)/);
  assert.match(resetPasswordPage, /signOut\(\)/);
  assert.match(resetPasswordPage, /비밀번호가 변경되었어요\. 새 비밀번호로 로그인해주세요\./);
  assert.match(resetPasswordPage, /로그인하기/);
});

test("password login remains unchanged", () => {
  assert.match(loginPage, /signInWithPassword\(\{/);
  assert.match(loginPage, /이메일과 비밀번호로 로그인해 주세요\./);
});
