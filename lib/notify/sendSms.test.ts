import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSolapiSendManyPayload,
  normalizeSmsBody,
} from "./sendSms";

const confirmationBody = [
  "[TimeOpen] 예약이 확정되었어요.",
  "",
  "샵: TestShop",
  "서비스: Service1",
  "일시: 6월 27일 09:00",
  "문의: 인스타 DM @testshop",
].join("\n");

test("solapi outbound payload sends one clean message body only", () => {
  const payload = buildSolapiSendManyPayload("+821012345678", confirmationBody);
  const message = payload.messages[0];

  assert.equal(message.text, confirmationBody);
  assert.equal(message.subject, "");
  assert.equal(message.text.startsWith("[TimeOpen] 예약이 확정되었어요."), true);
  assert.equal(message.text.match(/\[TimeOpen\]/g)?.length, 1);
  assert.doesNotMatch(message.text, /\[Web발신\]/);
  assert.equal("title" in message, false);
  assert.equal("content" in message, false);
  assert.equal("message" in message, false);
});

test("sms body normalization removes leading and trailing whitespace only", () => {
  assert.equal(
    normalizeSmsBody(`\n\n${confirmationBody}\n\n`),
    confirmationBody
  );
});
