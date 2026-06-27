import crypto from "crypto";

const API_KEY = process.env.SOLAPI_API_KEY!;
const API_SECRET = process.env.SOLAPI_API_SECRET!;
const SENDER = process.env.SOLAPI_SENDER!;

export type SmsSendResult = {
  statusCode: number;
  responsePayload: unknown;
};

export class SmsSendError extends Error {
  result: SmsSendResult;

  constructor(message: string, result: SmsSendResult) {
    super(message);
    this.name = "SmsSendError";
    this.result = result;
  }
}

export function normalizeSmsBody(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

export function normalizeSmsSubject(subject?: string | null) {
  const text = subject?.trim() ?? "";
  if (!text) return "예약 안내";

  const headlineMatch = text.match(/^(.+?)\s+예약(?:이| 요청| 정보)/);
  if (headlineMatch?.[1]?.trim()) {
    return headlineMatch[1].trim();
  }

  if (/^예약(?:이| 요청| 정보)/.test(text)) {
    return "예약 안내";
  }

  return text;
}

export function buildSolapiSendManyPayload(
  to: string,
  text: string,
  options: { subject?: string | null } = {}
) {
  const body = normalizeSmsBody(text);
  const subject = normalizeSmsSubject(options.subject);

  return {
    messages: [
      {
        to,
        from: SENDER,
        subject,
        text: body,
      },
    ],
  };
}

function getAuthHeaders() {
  const date = new Date().toISOString();
  const salt = crypto.randomUUID();
  const signature = crypto
    .createHmac("sha256", API_SECRET)
    .update(date + salt)
    .digest("hex");

  return {
    Authorization: `HMAC-SHA256 apiKey=${API_KEY}, date=${date}, salt=${salt}, signature=${signature}`,
    "Content-Type": "application/json",
  };
}

export async function sendSms(
  to: string,
  text: string,
  options: { subject?: string | null } = {}
) {
  const body = normalizeSmsBody(text);

  console.log("[sendSms] to =", to, "from =", SENDER);
  console.log("[sendSms] subject =", normalizeSmsSubject(options.subject));
  console.log("[sendSms] text =", body);

  const res = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(buildSolapiSendManyPayload(to, body, options)),
  });

  const bodyText = await res.text();
  let responsePayload: unknown = bodyText;

  try {
    responsePayload = JSON.parse(bodyText);
  } catch {
    // JSON이 아닌 provider 응답은 원문 문자열로 유지
  }

  console.log("[sendSms] status =", res.status);
  console.log("[sendSms] body =", bodyText);

  if (!res.ok) {
    throw new SmsSendError("SMS error: " + bodyText, {
      statusCode: res.status,
      responsePayload,
    });
  }

  return {
    statusCode: res.status,
    responsePayload,
  } satisfies SmsSendResult;
}
