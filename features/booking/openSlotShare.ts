type OpenSlotShareInput = {
  dateISO: string;
  time: string;
  note?: string;
  bookingUrl: string;
  todayISO: string;
};

function parseISODate(dateISO: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO);
  if (!match) return null;

  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { month, day };
}

export function formatOpenSlotTime(time: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return time;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return time;

  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")}`;
}

export function buildOpenSlotShareMessage({
  dateISO,
  time,
  note,
  bookingUrl,
  todayISO,
}: OpenSlotShareInput) {
  const parsedDate = parseISODate(dateISO);
  const dateLabel =
    dateISO === todayISO
      ? "오늘"
      : parsedDate
        ? `${parsedDate.month}월 ${parsedDate.day}일`
        : dateISO;
  const lines = [`${dateLabel} ${formatOpenSlotTime(time)} 예약 가능해요 ✨`];
  const cleanNote = note?.trim();

  if (cleanNote) {
    lines.push(cleanNote);
  }

  lines.push("예약은 여기서 해주세요:", bookingUrl);
  return lines.join("\n");
}
