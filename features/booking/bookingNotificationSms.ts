function clean(value: string | undefined) {
  return value?.trim() ?? "";
}

function buildShopHeadline(shopName: string | undefined, message: string) {
  const name = clean(shopName);
  return name ? `${name} ${message}` : message;
}

function buildReservationSummaryLine(dateTime: string, serviceName: string) {
  return `${serviceName || "예약"}, ${dateTime}`;
}

function appendManageUrl(lines: string[], manageUrl: string) {
  const url = clean(manageUrl);
  if (!url) return;

  lines.push("", "확인·취소", url);
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
  const manageUrl = clean(params.manageUrl);
  const lines = [
    buildShopHeadline(params.shopName, "예약 확정"),
    "",
    buildReservationSummaryLine(params.dateTime, params.serviceName),
  ];

  if (locationText) {
    lines.push(locationText);
  }

  appendManageUrl(lines, manageUrl);

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
  const manageUrl = clean(params.manageUrl);
  const lines = [
    buildShopHeadline(params.shopName, "예약 요청 접수"),
    "",
    buildReservationSummaryLine(params.dateTime, params.serviceName),
  ];

  if (locationText) {
    lines.push(locationText);
  }

  appendManageUrl(lines, manageUrl);

  lines.push("", "샵에서 확인 후 확정 안내를 보내드릴게요.");

  return lines.join("\n");
}

export function buildBookingChangedCustomerSms(params: {
  shopName: string;
  serviceName: string;
  dateTime: string;
  manageUrl?: string;
}) {
  const manageUrl = clean(params.manageUrl);
  const lines = [
    buildShopHeadline(params.shopName, "예약 변경"),
    "",
    buildReservationSummaryLine(params.dateTime, params.serviceName),
  ];

  appendManageUrl(lines, manageUrl);

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
    buildShopHeadline(params.shopName, "예약 취소"),
    "",
    buildReservationSummaryLine(params.dateTime, params.serviceName),
  ];

  if (bookingContact) {
    lines.push(`문의: ${bookingContact}`);
  }

  return lines.join("\n");
}

export function buildOwnerNewReservationSms(params: {
  customerName: string;
  serviceName: string;
  dateTime: string;
  customerPhone: string;
}) {
  return [
    "새 예약이 들어왔어요.",
    "",
    `고객: ${params.customerName || "-"}`,
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
    `연락처: ${params.customerPhone || "-"}`,
  ].join("\n");
}

export function buildOwnerReservationRequestSms(params: {
  customerName: string;
  serviceName: string;
  dateTime: string;
  customerPhone: string;
}) {
  return [
    "확인 대기 예약이 들어왔어요.",
    "",
    `고객: ${params.customerName || "-"}`,
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
    `연락처: ${params.customerPhone || "-"}`,
    "",
    "예약관리에서 확정해주세요.",
  ].join("\n");
}

export function buildOwnerCancellationSms(params: {
  customerName: string;
  serviceName: string;
  dateTime: string;
  customerPhone: string;
}) {
  return [
    "고객이 예약을 취소했어요.",
    "",
    `고객: ${params.customerName || "-"}`,
    `서비스: ${params.serviceName || "예약"}`,
    `일시: ${params.dateTime}`,
    `연락처: ${params.customerPhone || "-"}`,
  ].join("\n");
}
