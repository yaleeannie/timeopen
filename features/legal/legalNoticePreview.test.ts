import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLegalNoticeDraftFromEnv,
  buildLegalNoticePreview,
  sendLegalNoticePreviewTest,
} from "./legalNoticePreview";

const notice = {
  type: "terms" as const,
  version: "2026-07-01",
  title: "이용약관 변경 안내",
  body: "이용약관 변경 내용을 미리 안내드립니다.",
};

test("legal notice preview mode does not send without explicit test email", async () => {
  let fetchCalled = false;
  const result = await sendLegalNoticePreviewTest(notice, {
    env: {},
    fetchImpl: async () => {
      fetchCalled = true;
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(result.sent, false);
  assert.equal(result.skipped, true);
  assert.equal(result.preview.shouldSend, false);
  assert.equal(result.preview.to, null);
  assert.equal(fetchCalled, false);
});

test("legal notice preview can create an explicit one-recipient test payload", async () => {
  let payload: any = null;
  const result = await sendLegalNoticePreviewTest(notice, {
    env: {
      RESEND_API_KEY: "test-key",
      LEGAL_NOTICE_TEST_EMAIL: "owner@shop.co.kr",
      LEGAL_NOTICE_FROM_EMAIL: "TimeOpen Legal <legal@timeopen.app>",
    },
    fetchImpl: async (_url, init) => {
      payload = JSON.parse(String(init?.body));
      return new Response(null, { status: 204 });
    },
  });

  assert.equal(result.sent, true);
  assert.equal(result.preview.to, "owner@shop.co.kr");
  assert.deepEqual(payload.to, ["owner@shop.co.kr"]);
  assert.equal(payload.from, "TimeOpen Legal <legal@timeopen.app>");
  assert.equal(payload.subject, "[TimeOpen] 이용약관 변경 안내");
  assert.match(payload.text, /https:\/\/timeopen\.app\/terms/);
});

test("legal notice preview accepts --to but never uses reservation customer fields", () => {
  const preview = buildLegalNoticePreview(notice, {
    env: {},
    args: ["--to", "test@timeopen.app"],
  });

  assert.equal(preview.shouldSend, true);
  assert.equal(preview.to, "test@timeopen.app");
  assert.equal("customer_phone" in preview, false);
  assert.equal("reservation_id" in preview, false);
});

test("legal notice draft defaults to privacy and Korean content", () => {
  const draft = buildLegalNoticeDraftFromEnv({
    LEGAL_NOTICE_VERSION: "2026-07-01",
  });

  assert.equal(draft.type, "privacy");
  assert.equal(draft.version, "2026-07-01");
  assert.match(draft.title, /개인정보처리방침/);
  assert.match(draft.body, /TimeOpen 개인정보처리방침/);
});
