export function buildBookingConfirmationCustomerSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  locationText?: string;
  noticeText?: string;
  bookingContact?: string;
}) {
  const locationText = params.locationText?.trim();
  const noticeText = params.noticeText?.trim();
  const bookingContact = params.bookingContact?.trim();
  const lines = [
    "[TimeOpen] 예약이 확정되었어요.",
    "",
    `샵: ${params.shopName || "예약"}`,
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
  ];

  if (locationText) {
    lines.push(`위치: ${locationText}`);
  }

  if (noticeText) {
    lines.push(`안내: ${noticeText}`);
  }

  if (bookingContact) {
    lines.push(`문의: ${bookingContact}`);
  }

  return lines.join("\n");
}

export function buildBookingRequestCustomerSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  locationText?: string;
  bookingContact?: string;
}) {
  const locationText = params.locationText?.trim();
  const bookingContact = params.bookingContact?.trim();
  const lines = [
    "[TimeOpen] 예약 요청이 접수되었어요.",
    "",
    `샵: ${params.shopName || "예약"}`,
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
  ];

  if (locationText) {
    lines.push(`위치: ${locationText}`);
  }

  if (bookingContact) {
    lines.push(`문의: ${bookingContact}`);
  }

  lines.push("", "샵에서 확인 후 예약 확정 안내를 보내드릴게요.");

  return lines.join("\n");
}
