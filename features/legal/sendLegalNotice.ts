// Server-only helper for future internal/admin legal notice workflows.
// Do not import this module from client components.

export type LegalNoticeType = "terms" | "privacy";

export type LegalNoticeDraftInput = {
  type: LegalNoticeType;
  version: string;
  title: string;
  body: string;
};

export type OwnerMemberLegalNoticeRecipient = {
  userId: string | null;
  email: string;
};

export type LegalNoticeRecord = LegalNoticeDraftInput & {
  id: string;
};

export type LegalNoticeRecipientStatus = "pending" | "sent" | "failed";

export type LegalNoticeRecipientResult = {
  recipientId: string | null;
  email: string;
  status: LegalNoticeRecipientStatus;
  errorMessage?: string;
};

type QueryError = {
  message: string;
};

type SingleResult<T> = Promise<{
  data: T | null;
  error: QueryError | null;
}>;

type InsertSelectable<T> = {
  select(columns: string): {
    single(): SingleResult<T>;
  };
};

type UpdateFilter = {
  eq(column: string, value: string): Promise<{
    error: QueryError | null;
  }>;
};

type LegalNoticeTable<T> = {
  insert(values: unknown): InsertSelectable<T>;
  update(values: unknown): UpdateFilter;
};

export type LegalNoticeDbClient = {
  from(table: "legal_notices" | "legal_notice_recipients"): LegalNoticeTable<{ id: string }>;
};

type SendLegalNoticeOptions = {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  appUrl?: string;
  now?: Date;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM_EMAIL = "TimeOpen <contact@timeopen.app>";
const DEFAULT_APP_URL = "https://timeopen.app";

export function getLegalNoticeFromEmail(env: Record<string, string | undefined> = process.env) {
  return (
    env.LEGAL_NOTICE_FROM_EMAIL?.trim() ||
    env.BETA_INQUIRY_FROM_EMAIL?.trim() ||
    DEFAULT_FROM_EMAIL
  );
}

export function getLegalNoticeLink(type: LegalNoticeType, appUrl = DEFAULT_APP_URL) {
  const baseUrl = appUrl.replace(/\/$/, "");
  return `${baseUrl}/${type === "terms" ? "terms" : "privacy"}`;
}

export function buildLegalNoticeEmail(
  notice: LegalNoticeDraftInput,
  appUrl = DEFAULT_APP_URL
) {
  const documentLabel = notice.type === "terms" ? "이용약관" : "개인정보처리방침";
  const link = getLegalNoticeLink(notice.type, appUrl);
  const subject = `[TimeOpen] ${documentLabel} 변경 안내`;
  const text = [
    subject,
    "",
    `변경 문서: ${documentLabel}`,
    `버전: ${notice.version}`,
    "",
    notice.title,
    "",
    notice.body,
    "",
    `자세히 보기: ${link}`,
    "",
    "문의: contact@timeopen.app",
  ].join("\n");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.7">
      <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(subject)}</h1>
      <p style="margin:0 0 8px"><strong>변경 문서:</strong> ${escapeHtml(documentLabel)}</p>
      <p style="margin:0 0 16px"><strong>버전:</strong> ${escapeHtml(notice.version)}</p>
      <h2 style="font-size:16px;margin:0 0 8px">${escapeHtml(notice.title)}</h2>
      <p style="white-space:pre-wrap;margin:0 0 18px">${escapeHtml(notice.body)}</p>
      <p style="margin:0 0 8px"><a href="${escapeHtml(link)}">자세히 보기</a></p>
      <p style="margin:0;color:#64748b">문의: contact@timeopen.app</p>
    </div>
  `;

  return { subject, text, html, link };
}

export function buildPendingLegalNoticeRecipientRows(
  noticeId: string,
  recipients: OwnerMemberLegalNoticeRecipient[]
) {
  return recipients.map((recipient) => ({
    notice_id: noticeId,
    user_id: recipient.userId,
    email: normalizeEmail(recipient.email),
    status: "pending" as const,
  }));
}

export async function createLegalNoticeDraft(
  db: LegalNoticeDbClient,
  input: LegalNoticeDraftInput
) {
  validateLegalNoticeDraft(input);

  const { data, error } = await db
    .from("legal_notices")
    .insert({
      type: input.type,
      version: input.version.trim(),
      title: input.title.trim(),
      body: input.body.trim(),
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message || "법적 고지 초안을 만들지 못했습니다.");
  }

  return { ...input, id: data.id };
}

export async function sendLegalNoticeToOwnerMembers(
  db: LegalNoticeDbClient,
  notice: LegalNoticeRecord,
  recipients: OwnerMemberLegalNoticeRecipient[],
  options: SendLegalNoticeOptions = {}
) {
  validateLegalNoticeDraft(notice);
  const safeRecipients = validateOwnerMemberRecipients(recipients);
  const env = options.env ?? process.env;
  const apiKey = env.RESEND_API_KEY?.trim();
  const fetchImpl = options.fetchImpl ?? fetch;
  const email = buildLegalNoticeEmail(notice, options.appUrl);
  const from = getLegalNoticeFromEmail(env);
  const results: LegalNoticeRecipientResult[] = [];

  // TODO: add admin-only owner/member recipient selection after admin workflow is ready.
  // Do not use reservation customers, beta inquiries, or public booking customer data.
  for (const recipient of safeRecipients) {
    const { data: recipientRow, error: insertError } = await db
      .from("legal_notice_recipients")
      .insert({
        notice_id: notice.id,
        user_id: recipient.userId,
        email: recipient.email,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !recipientRow?.id) {
      results.push({
        recipientId: null,
        email: recipient.email,
        status: "failed",
        errorMessage: insertError?.message || "수신자 기록을 만들지 못했습니다.",
      });
      continue;
    }

    if (!apiKey) {
      const errorMessage = "RESEND_API_KEY is not set";
      await markRecipientFailed(db, recipientRow.id, errorMessage);
      results.push({
        recipientId: recipientRow.id,
        email: recipient.email,
        status: "failed",
        errorMessage,
      });
      continue;
    }

    try {
      const response = await fetchImpl(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [recipient.email],
          subject: email.subject,
          text: email.text,
          html: email.html,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`Resend email failed: ${response.status} ${body}`.trim());
      }

      await db
        .from("legal_notice_recipients")
        .update({
          status: "sent",
          sent_at: (options.now ?? new Date()).toISOString(),
          error_message: null,
        })
        .eq("id", recipientRow.id);

      results.push({
        recipientId: recipientRow.id,
        email: recipient.email,
        status: "sent",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown email error";
      await markRecipientFailed(db, recipientRow.id, errorMessage);
      results.push({
        recipientId: recipientRow.id,
        email: recipient.email,
        status: "failed",
        errorMessage,
      });
    }
  }

  return results;
}

function validateLegalNoticeDraft(input: LegalNoticeDraftInput) {
  if (input.type !== "terms" && input.type !== "privacy") {
    throw new Error("지원하지 않는 법적 고지 유형입니다.");
  }
  if (!input.version.trim()) {
    throw new Error("법적 고지 버전이 필요합니다.");
  }
  if (!input.title.trim()) {
    throw new Error("법적 고지 제목이 필요합니다.");
  }
  if (!input.body.trim()) {
    throw new Error("법적 고지 본문이 필요합니다.");
  }
}

function validateOwnerMemberRecipients(recipients: OwnerMemberLegalNoticeRecipient[]) {
  return recipients.map((recipient) => {
    const email = normalizeEmail(recipient.email);
    if (!email || !email.includes("@")) {
      throw new Error("수신자 이메일 형식이 올바르지 않습니다.");
    }
    return {
      userId: recipient.userId,
      email,
    };
  });
}

async function markRecipientFailed(
  db: LegalNoticeDbClient,
  recipientId: string,
  errorMessage: string
) {
  await db
    .from("legal_notice_recipients")
    .update({
      status: "failed",
      error_message: truncateError(errorMessage),
    })
    .eq("id", recipientId);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function truncateError(errorMessage: string) {
  return errorMessage.length > 500 ? `${errorMessage.slice(0, 497)}...` : errorMessage;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
