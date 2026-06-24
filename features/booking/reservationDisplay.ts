const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/;

function parseDateParts(value: string) {
  const trimmed = value.trim();
  const dateOnlyMatch = DATE_ONLY_RE.exec(trimmed);
  if (dateOnlyMatch) {
    return {
      year: Number(dateOnlyMatch[1]),
      month: Number(dateOnlyMatch[2]),
      day: Number(dateOnlyMatch[3]),
    };
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const match = DATE_ONLY_RE.exec(parts);
  if (!match) return null;

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function formatReservationTimeDisplay(value: unknown) {
  if (value === null || value === undefined) return "";

  const raw = String(value).trim();
  if (!raw) return "";

  const timeMatch = TIME_RE.exec(raw);
  if (timeMatch) {
    return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatReservationDateKorean(value: unknown) {
  if (value === null || value === undefined) return "";

  const parts = parseDateParts(String(value));
  if (!parts) return String(value).trim();

  return `${parts.year}년 ${parts.month}월 ${parts.day}일`;
}

export function formatReservationDateCompactKorean(value: unknown) {
  if (value === null || value === undefined) return "";

  const parts = parseDateParts(String(value));
  if (!parts) return String(value).trim();

  return `${parts.month}월 ${parts.day}일`;
}

export function formatReservationTimeRangeDisplay(
  startTime: unknown,
  endTime: unknown
) {
  const start = formatReservationTimeDisplay(startTime);
  const end = formatReservationTimeDisplay(endTime);

  if (!start) return "";
  return end ? `${start} ~ ${end}` : start;
}
