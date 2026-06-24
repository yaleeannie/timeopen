#!/usr/bin/env tsx
/*
 * Manual legal notice email preview/test workflow.
 *
 * Preview only:
 *   pnpm legal:preview
 *
 * Send one explicit test email only:
 *   LEGAL_NOTICE_TEST_EMAIL=contact@timeopen.app RESEND_API_KEY=... pnpm legal:preview
 *   pnpm legal:preview --to contact@timeopen.app
 *
 * Optional content env:
 *   LEGAL_NOTICE_TYPE=terms | privacy
 *   LEGAL_NOTICE_VERSION=2026-07-01
 *   LEGAL_NOTICE_TITLE="이용약관 변경 안내"
 *   LEGAL_NOTICE_BODY="변경 요약..."
 *
 * Safety:
 * - This script never sends to all users by default.
 * - This script never collects owner/member recipients.
 * - Never use reservation customers or public booking customer data as recipients.
 */

import {
  buildLegalNoticeDraftFromEnv,
  sendLegalNoticePreviewTest,
} from "../../features/legal/legalNoticePreview";

async function main() {
  const notice = buildLegalNoticeDraftFromEnv(process.env);
  const result = await sendLegalNoticePreviewTest(notice, {
    env: process.env,
    args: process.argv.slice(2),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://timeopen.app",
  });

  printPreview(result.preview);

  if (result.sent) {
    console.log(`\n[legal:preview] test email sent to ${result.preview.to}`);
  } else {
    console.log(
      "\n[legal:preview] no LEGAL_NOTICE_TEST_EMAIL or --to was provided; preview only, no email sent."
    );
  }
}

function printPreview(preview: {
  from: string;
  to: string | null;
  subject: string;
  text: string;
}) {
  console.log("[legal:preview] legal notice email preview");
  console.log(`From: ${preview.from}`);
  console.log(`To: ${preview.to ?? "(not set; preview only)"}`);
  console.log(`Subject: ${preview.subject}`);
  console.log("");
  console.log(preview.text);
}

main().catch((error) => {
  console.error("[legal:preview] failed", error);
  process.exit(1);
});
