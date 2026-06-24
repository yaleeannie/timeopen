import assert from "node:assert/strict";
import test from "node:test";
import {
  buildLegalNoticeEmail,
  buildPendingLegalNoticeRecipientRows,
  getLegalNoticeFromEmail,
  sendLegalNoticeToOwnerMembers,
  type LegalNoticeDbClient,
  type LegalNoticeRecord,
} from "./sendLegalNotice";

const notice: LegalNoticeRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  type: "privacy",
  version: "2026-07-01",
  title: "개인정보처리방침 변경 안내",
  body: "예약 고객 개인정보 처리 문구가 일부 변경됩니다.",
};

test("legal notice email content includes the correct Korean subject and policy link", () => {
  const email = buildLegalNoticeEmail(notice, "https://timeopen.app");

  assert.equal(email.subject, "[TimeOpen] 개인정보처리방침 변경 안내");
  assert.equal(email.link, "https://timeopen.app/privacy");
  assert.match(email.text, /변경 문서: 개인정보처리방침/);
  assert.match(email.text, /버전: 2026-07-01/);
  assert.match(email.text, /https:\/\/timeopen\.app\/privacy/);
  assert.match(email.text, /contact@timeopen\.app/);
});

test("legal notice sender email uses env fallback order", () => {
  assert.equal(
    getLegalNoticeFromEmail({
      LEGAL_NOTICE_FROM_EMAIL: "TimeOpen Legal <legal@timeopen.app>",
      BETA_INQUIRY_FROM_EMAIL: "TimeOpen Beta <beta@timeopen.app>",
    }),
    "TimeOpen Legal <legal@timeopen.app>"
  );
  assert.equal(
    getLegalNoticeFromEmail({
      BETA_INQUIRY_FROM_EMAIL: "TimeOpen Beta <beta@timeopen.app>",
    }),
    "TimeOpen Beta <beta@timeopen.app>"
  );
  assert.equal(getLegalNoticeFromEmail({}), "TimeOpen <contact@timeopen.app>");
});

test("legal notice recipient rows only use owner/member account fields", () => {
  const rows = buildPendingLegalNoticeRecipientRows(notice.id, [
    {
      userId: "11111111-1111-1111-1111-111111111111",
      email: "OWNER@SHOP.CO.KR",
    },
  ]);

  assert.deepEqual(rows, [
    {
      notice_id: notice.id,
      user_id: "11111111-1111-1111-1111-111111111111",
      email: "owner@shop.co.kr",
      status: "pending",
    },
  ]);
  assert.equal("customer_phone" in rows[0], false);
  assert.equal("reservation_id" in rows[0], false);
});

test("legal notice helper records failed status when Resend env is missing", async () => {
  const updates: unknown[] = [];
  const db: LegalNoticeDbClient = {
    from(table) {
      return {
        insert(values) {
          return {
            select() {
              return {
                async single() {
                  return {
                    data: { id: `${table}-row` },
                    error: null,
                  };
                },
              };
            },
          };
        },
        update(values) {
          return {
            async eq(column, value) {
              updates.push({ table, values, column, value });
              return { error: null };
            },
          };
        },
      };
    },
  };

  const results = await sendLegalNoticeToOwnerMembers(
    db,
    notice,
    [{ userId: "11111111-1111-1111-1111-111111111111", email: "owner@shop.co.kr" }],
    { env: {}, fetchImpl: async () => new Response(null, { status: 204 }) }
  );

  assert.deepEqual(results, [
    {
      recipientId: "legal_notice_recipients-row",
      email: "owner@shop.co.kr",
      status: "failed",
      errorMessage: "RESEND_API_KEY is not set",
    },
  ]);
  assert.deepEqual(updates, [
    {
      table: "legal_notice_recipients",
      values: {
        status: "failed",
        error_message: "RESEND_API_KEY is not set",
      },
      column: "id",
      value: "legal_notice_recipients-row",
    },
  ]);
});
