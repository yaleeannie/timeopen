import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSolapiSendManyPayload,
  normalizeSmsBody,
  normalizeSmsSubject,
} from "./sendSms";

const confirmationBody = [
  "TestShop 예약이 확정되었어요.",
  "",
  "서비스: Service1",
  "일시: 6월 27일 09:00",
  "문의: 인스타 DM @testshop",
].join("\n");

test("solapi outbound payload sends one clean message body only", () => {
  const payload = buildSolapiSendManyPayload("+821012345678", confirmationBody, {
    subject: "TestShop",
  });
  const message = payload.messages[0];

  assert.equal(message.text, confirmationBody);
  assert.equal(message.subject, "TestShop");
  assert.equal(message.text.startsWith("TestShop 예약이 확정되었어요."), true);
  assert.doesNotMatch(message.text, /\[TimeOpen\]/);
  assert.doesNotMatch(message.text, /TimeOpen/);
  assert.doesNotMatch(message.text, /샵:/);
  assert.doesNotMatch(message.text, /\[Web발신\]/);
  assert.equal("title" in message, false);
  assert.equal("content" in message, false);
  assert.equal("message" in message, false);
});

test("solapi subject uses shop name or safe fallback, not the full headline", () => {
  assert.equal(normalizeSmsSubject("TestShop"), "TestShop");
  assert.equal(normalizeSmsSubject("  "), "예약 안내");

  const payload = buildSolapiSendManyPayload("+821012345678", confirmationBody, {
    subject: "TestShop 예약이 확정되었어요.",
  });

  assert.equal(payload.messages[0].subject, "TestShop");
  assert.notEqual(payload.messages[0].subject, payload.messages[0].text);
});

test("sms body normalization removes leading and trailing whitespace only", () => {
  assert.equal(
    normalizeSmsBody(`\n\n${confirmationBody}\n\n`),
    confirmationBody
  );
});
