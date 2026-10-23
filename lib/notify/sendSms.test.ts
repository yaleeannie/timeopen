import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSolapiSendManyPayload,
  isSmsDeliverySuppressed,
  normalizeSmsBody,
  normalizeSmsSubject,
  sendSms,
  SmsDeliverySuppressedError,
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

test("maintenance mode suppresses SMS before any provider request", async () => {
  const previousMaintenance = process.env.TIMEOPEN_MAINTENANCE_MODE;
  const previousSmsEnabled = process.env.TIMEOPEN_SMS_ENABLED;
  const originalFetch = globalThis.fetch;
  let calls = 0;

  try {
    process.env.TIMEOPEN_MAINTENANCE_MODE = "true";
    process.env.TIMEOPEN_SMS_ENABLED = "true";
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response("{}", { status: 200 });
    }) as typeof fetch;

    assert.equal(isSmsDeliverySuppressed(), true);
    await assert.rejects(
      sendSms("+821012345678", "should never be sent"),
      SmsDeliverySuppressedError
    );
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousMaintenance === undefined) delete process.env.TIMEOPEN_MAINTENANCE_MODE;
    else process.env.TIMEOPEN_MAINTENANCE_MODE = previousMaintenance;
    if (previousSmsEnabled === undefined) delete process.env.TIMEOPEN_SMS_ENABLED;
    else process.env.TIMEOPEN_SMS_ENABLED = previousSmsEnabled;
  }
});

test("SMS remains off unless explicitly enabled", () => {
  const previousSmsEnabled = process.env.TIMEOPEN_SMS_ENABLED;
  const previousMaintenance = process.env.TIMEOPEN_MAINTENANCE_MODE;
  try {
    process.env.TIMEOPEN_MAINTENANCE_MODE = "false";
    delete process.env.TIMEOPEN_SMS_ENABLED;
    assert.equal(isSmsDeliverySuppressed(), true);
    process.env.TIMEOPEN_SMS_ENABLED = "false";
    assert.equal(isSmsDeliverySuppressed(), true);
    process.env.TIMEOPEN_SMS_ENABLED = "true";
    assert.equal(isSmsDeliverySuppressed(), false);
  } finally {
    if (previousSmsEnabled === undefined) delete process.env.TIMEOPEN_SMS_ENABLED;
    else process.env.TIMEOPEN_SMS_ENABLED = previousSmsEnabled;
    if (previousMaintenance === undefined) delete process.env.TIMEOPEN_MAINTENANCE_MODE;
    else process.env.TIMEOPEN_MAINTENANCE_MODE = previousMaintenance;
  }
});
