function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function buildShopHeadline(shopName: string | undefined, message: string) {
  const name = clean(shopName);
  return name ? `${name} ${message}` : message;
}

export function buildBookingConfirmationCustomerSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  locationText?: string;
  noticeText?: string;
  bookingContact?: string;
  manageUrl?: string;
}) {
  const locationText = clean(params.locationText);
  const noticeText = clean(params.noticeText);
  const bookingContact = clean(params.bookingContact);
  const manageUrl = clean(params.manageUrl);
  const lines = [
    buildShopHeadline(params.shopName, "예약이 확정되었어요."),
    "",
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

  if (manageUrl) {
    lines.push(`예약 확인/취소: ${manageUrl}`);
  }

  return lines.join("\n");
}

export function buildBookingRequestCustomerSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  locationText?: string;
  bookingContact?: string;
  manageUrl?: string;
}) {
  const locationText = clean(params.locationText);
  const bookingContact = clean(params.bookingContact);
  const manageUrl = clean(params.manageUrl);
  const lines = [
    buildShopHeadline(params.shopName, "예약 요청이 접수되었어요."),
    "",
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
  ];

  if (locationText) {
    lines.push(`위치: ${locationText}`);
  }

  if (bookingContact) {
    lines.push(`문의: ${bookingContact}`);
  }

  if (manageUrl) {
    lines.push(`예약 확인/취소: ${manageUrl}`);
  }

  lines.push("", "샵에서 확인 후 예약 확정 안내를 보내드릴게요.");

  return lines.join("\n");
}

export function buildBookingCancelledCustomerSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  bookingContact?: string;
}) {
  const bookingContact = clean(params.bookingContact);
  const lines = [
    buildShopHeadline(params.shopName, "예약이 취소되었어요."),
    "",
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
  ];

  if (bookingContact) {
    lines.push(`문의: ${bookingContact}`);
  }

  return lines.join("\n");
}
