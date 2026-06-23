import { formatOpenSlotTime } from "./openSlotShare";

type StoryTheme = {
  primary: string;
  accent: string;
  soft: string;
  glow: boolean;
  ink: string;
  contrast: string;
};

type OpenSlotStoryInput = {
  dateISO: string;
  time: string;
  note?: string;
  shopName: string;
  todayISO: string;
  theme: StoryTheme;
};

function parseISODate(dateISO: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return null;

  return { month: Number(match[2]), day: Number(match[3]) };
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function splitNote(value: string, maxLength = 20) {
  const cleanValue = value.trim();
  if (!cleanValue) return [];

  const lines: string[] = [];
  let current = "";

  for (const word of cleanValue.split(/\s+/)) {
    if (word.length > maxLength) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += maxLength) {
        lines.push(word.slice(index, index + maxLength));
      }
      continue;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxLength) {
      current = next;
      continue;
    }

    if (current) lines.push(current);
    current = word;
  }

  if (current) lines.push(current);
  return lines.slice(0, 2);
}

export function formatOpenSlotStoryLabel(
  dateISO: string,
  time: string,
  todayISO: string
) {
  const parsedDate = parseISODate(dateISO);
  const dateLabel =
    dateISO === todayISO
      ? "오늘"
      : parsedDate
        ? `${parsedDate.month}월 ${parsedDate.day}일`
        : dateISO;

  return `${dateLabel} ${formatOpenSlotTime(time)} 예약 가능`;
}

export function buildOpenSlotStorySvg({
  dateISO,
  time,
  note,
  shopName,
  todayISO,
  theme,
}: OpenSlotStoryInput) {
  const mainLabel = formatOpenSlotStoryLabel(dateISO, time, todayISO);
  const mainTimeLabel = escapeXml(mainLabel.replace(/ 예약 가능$/, ""));
  const safeShopName = escapeXml(shopName.trim() || "TimeOpen Shop");
  const noteLines = splitNote(note ?? "").map(escapeXml);
  const noteMarkup = noteLines
    .map(
      (line, index) =>
        `<text x="540" y="${1170 + index * 68}" text-anchor="middle" font-size="42" font-weight="700" fill="#334155">${line}</text>`
    )
    .join("");
  const backgroundMarkup = theme.glow
    ? `<rect width="1080" height="1920" fill="url(#background)"/>
  <circle cx="145" cy="235" r="250" fill="${theme.accent}" fill-opacity="0.2" filter="url(#blur)"/>
  <circle cx="940" cy="1510" r="320" fill="${theme.primary}" fill-opacity="0.14" filter="url(#blur)"/>`
    : `<rect width="1080" height="1920" fill="${theme.soft}"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs>
    <linearGradient id="background" x1="90" y1="80" x2="990" y2="1840" gradientUnits="userSpaceOnUse">
      <stop stop-color="${theme.soft}"/>
      <stop offset="0.5" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="${theme.accent}" stop-opacity="0.28"/>
    </linearGradient>
    <linearGradient id="brand" x1="330" y1="0" x2="750" y2="0" gradientUnits="userSpaceOnUse">
      <stop stop-color="${theme.accent}"/>
      <stop offset="1" stop-color="${theme.primary}"/>
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="76"/>
    </filter>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="34" flood-color="${theme.primary}" flood-opacity="0.16"/>
    </filter>
  </defs>
  ${backgroundMarkup}
  <rect x="78" y="82" width="924" height="1756" rx="72" fill="#FFFFFF" fill-opacity="${theme.glow ? "0.68" : "0.96"}" stroke="#FFFFFF" stroke-width="3" filter="url(#shadow)"/>
  <text x="540" y="218" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="34" font-weight="800" fill="${theme.ink}">TimeOpen</text>
  <text x="540" y="315" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="48" font-weight="800" fill="#0F172A">${safeShopName}</text>
  <rect x="418" y="382" width="244" height="18" rx="9" fill="url(#brand)"/>
  <text x="540" y="705" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="54" font-weight="800" fill="#334155">OPEN SLOT</text>
  <text x="540" y="835" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="82" font-weight="900" fill="#0F172A">${mainTimeLabel}</text>
  <text x="540" y="945" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="88" font-weight="900" fill="${theme.ink}">예약 가능</text>
  <text x="540" y="1045" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="38" font-weight="700" fill="#475569">원하시는 시간에 편하게 예약해주세요</text>
  ${noteMarkup}
  <rect x="220" y="1428" width="640" height="142" rx="71" fill="url(#brand)"/>
  <text x="540" y="1518" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="42" font-weight="900" fill="${theme.contrast}">예약 링크는 프로필에서</text>
  <text x="540" y="1700" text-anchor="middle" font-family="Arial, Apple SD Gothic Neo, sans-serif" font-size="30" font-weight="700" fill="#64748B">Instagram booking link by TimeOpen</text>
</svg>`;
}

export function storySvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
