export function buildBookingConfirmationCustomerSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  locationText?: string;
  noticeText?: string;
  bookingContact?: string;
}) {
  const lines = [
    "[TimeOpen]",
    "",
    `${params.shopName || "예약"} 예약이 확정되었습니다.`,
    "",
    "서비스",
    params.serviceName || "예약",
    "",
    "일시",
    params.dateTime,
  ];

  const locationText = params.locationText?.trim();
  const noticeText = params.noticeText?.trim();
  const bookingContact = params.bookingContact?.trim();

  if (locationText) {
    lines.push("", "위치", locationText);
  }

  if (noticeText) {
    lines.push("", "안내", noticeText);
  }

  if (bookingContact) {
    lines.push("", "문의", bookingContact);
  }

  return lines.join("\n");
}
