import {
  buildLegalNoticeEmail,
  getLegalNoticeFromEmail,
  type LegalNoticeDraftInput,
  type LegalNoticeType,
} from "./sendLegalNotice";

export type LegalNoticePreviewOptions = {
  env?: Record<string, string | undefined>;
  args?: string[];
  fetchImpl?: typeof fetch;
  appUrl?: string;
};

export type LegalNoticePreview = {
  notice: LegalNoticeDraftInput;
  to: string | null;
  shouldSend: boolean;
  from: string;
  subject: string;
  text: string;
  html: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

export function buildLegalNoticeDraftFromEnv(
  env: Record<string, string | undefined> = process.env
): LegalNoticeDraftInput {
  const type = normalizeNoticeType(env.LEGAL_NOTICE_TYPE);
  const documentLabel = type === "terms" ? "이용약관" : "개인정보처리방침";

  return {
    type,
    version: env.LEGAL_NOTICE_VERSION?.trim() || new Date().toISOString().slice(0, 10),
    title: env.LEGAL_NOTICE_TITLE?.trim() || `${documentLabel} 변경 안내`,
    body:
      env.LEGAL_NOTICE_BODY?.trim() ||
      `${documentLabel}의 일부 내용이 변경될 예정입니다. 자세한 내용은 TimeOpen ${documentLabel} 페이지에서 확인할 수 있습니다.`,
  };
}

export function resolveLegalNoticeTestEmail(
  env: Record<string, string | undefined> = process.env,
  args: string[] = []
) {
  const toFlagIndex = args.findIndex((arg) => arg === "--to");
  if (toFlagIndex >= 0) {
    return args[toFlagIndex + 1]?.trim() || null;
  }

  const inlineTo = args.find((arg) => arg.startsWith("--to="));
  if (inlineTo) {
    return inlineTo.slice("--to=".length).trim() || null;
  }

  return env.LEGAL_NOTICE_TEST_EMAIL?.trim() || null;
}

export function buildLegalNoticePreview(
  notice: LegalNoticeDraftInput,
  options: LegalNoticePreviewOptions = {}
): LegalNoticePreview {
  const env = options.env ?? process.env;
  const to = resolveLegalNoticeTestEmail(env, options.args ?? []);
  const email = buildLegalNoticeEmail(notice, options.appUrl);

  return {
    notice,
    to,
    shouldSend: Boolean(to),
    from: getLegalNoticeFromEmail(env),
    subject: email.subject,
    text: email.text,
    html: email.html,
  };
}

export async function sendLegalNoticePreviewTest(
  notice: LegalNoticeDraftInput,
  options: LegalNoticePreviewOptions = {}
) {
  const preview = buildLegalNoticePreview(notice, options);

  if (!preview.shouldSend || !preview.to) {
    return {
      sent: false as const,
      skipped: true as const,
      preview,
    };
  }

  const env = options.env ?? process.env;
  const apiKey = env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required to send a legal notice test email.");
  }

  const response = await (options.fetchImpl ?? fetch)(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: preview.from,
      to: [preview.to],
      subject: preview.subject,
      text: preview.text,
      html: preview.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend email failed: ${response.status} ${body}`.trim());
  }

  return {
    sent: true as const,
    skipped: false as const,
    preview,
  };
}

function normalizeNoticeType(value: string | undefined): LegalNoticeType {
  return value === "terms" || value === "privacy" ? value : "privacy";
}
