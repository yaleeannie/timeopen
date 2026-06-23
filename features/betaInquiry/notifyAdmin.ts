type BetaInquiryNotification = {
  name: string;
  contact: string;
  shop_name: string | null;
  shop_type: string;
  current_booking_method: string;
  pain_point: string;
  monthly_booking_volume: string;
  message: string | null;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_NOTIFY_EMAIL = "contact@timeopen.app";
const DEFAULT_FROM_EMAIL = "TimeOpen <contact@timeopen.app>";

function getNotifyEmail() {
  return process.env.BETA_INQUIRY_NOTIFY_EMAIL?.trim() || DEFAULT_NOTIFY_EMAIL;
}

function getSenderEmail() {
  return process.env.BETA_INQUIRY_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
}

function formatSeoulDateTime(date: Date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatPlainText(params: BetaInquiryNotification, submittedAt: Date) {
  return [
    "[TimeOpen] 새로운 베타 파트너 신청",
    "",
    `신청일: ${formatSeoulDateTime(submittedAt)}`,
    `이름: ${params.name}`,
    `연락처: ${params.contact}`,
    `샵 이름: ${params.shop_name || "-"}`,
    `업종: ${params.shop_type}`,
    `현재 예약 방식: ${params.current_booking_method}`,
    `가장 불편한 점: ${params.pain_point}`,
    `월 예약 건수: ${params.monthly_booking_volume}`,
    "메시지:",
    params.message || "-",
  ].join("\n");
}

function formatHtml(params: BetaInquiryNotification, submittedAt: Date) {
  const rows = [
    ["신청일", formatSeoulDateTime(submittedAt)],
    ["이름", params.name],
    ["연락처", params.contact],
    ["샵 이름", params.shop_name || "-"],
    ["업종", params.shop_type],
    ["현재 예약 방식", params.current_booking_method],
    ["가장 불편한 점", params.pain_point],
    ["월 예약 건수", params.monthly_booking_volume],
    ["메시지", params.message || "-"],
  ];

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6">
      <h1 style="font-size:20px;margin:0 0 16px">새로운 베타 파트너 신청</h1>
      <table style="border-collapse:collapse;width:100%;max-width:640px">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <th style="width:140px;text-align:left;vertical-align:top;padding:8px 10px;border:1px solid #e2e8f0;background:#f8fafc;font-size:13px">${escapeHtml(label)}</th>
                  <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:14px;white-space:pre-wrap">${escapeHtml(value)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

export async function notifyAdminBetaInquiry(
  params: BetaInquiryNotification,
  submittedAt = new Date()
) {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.warn("[beta-inquiries] admin email skipped: RESEND_API_KEY is not set");
    return { ok: false as const, skipped: true as const };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getSenderEmail(),
      to: [getNotifyEmail()],
      subject: "[TimeOpen] 새로운 베타 파트너 신청",
      text: formatPlainText(params, submittedAt),
      html: formatHtml(params, submittedAt),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Resend email failed: ${response.status} ${body}`);
  }

  return { ok: true as const, skipped: false as const };
}

export const betaInquiryEmailForTest = {
  formatPlainText,
};
