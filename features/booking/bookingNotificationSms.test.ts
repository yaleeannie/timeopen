import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBookingCancelledCustomerSms,
  buildBookingChangedCustomerSms,
  buildBookingConfirmationCustomerSms,
  buildBookingRequestCustomerSms,
  buildOwnerCancellationSms,
  buildOwnerNewReservationSms,
  buildOwnerReservationRequestSms,
} from "./bookingNotificationSms";

function assertManageUrlLine(message: string, manageUrl: string) {
  const lines = message.split("\n");
  const urlIndex = lines.indexOf(manageUrl);

  assert.ok(urlIndex > 0, "manageUrl must be present on its own line");
  assert.equal(lines[urlIndex - 1], "확인·취소");
  assert.equal(lines.filter((value) => value.includes(manageUrl)).length, 1);
  assert.match(lines[urlIndex], /^https:\/\//);
  assert.doesNotMatch(lines[urlIndex], /[가-힣]/);
  assert.doesNotMatch(lines[urlIndex], /[.,:)]$/);
  assert.doesNotMatch(lines[urlIndex], /["'<>[\]]/);
}

test("booking confirmation SMS uses the compact customer format", () => {
  const manageUrl = "https://timeopen.app/r/k7Qp9xLm2A4z";
  const message = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    noticeText: "10분 전 도착 부탁드립니다.",
    bookingContact: "010-1234-5678",
    manageUrl,
  });

  assert.equal(
    message,
    [
      "타임네일 예약 확정",
      "",
      "젤네일, 6월 24일 11:20",
      "서울시 마포구 2층",
      "",
      "확인·취소",
      "https://timeopen.app/r/k7Qp9xLm2A4z",
    ].join("\n")
  );
  assertManageUrlLine(message, manageUrl);
  assert.doesNotMatch(message, /확인·취소:/);
  assert.doesNotMatch(message, /서비스:|일시:|위치:/);
  assert.doesNotMatch(message, /문의:/);
  assert.doesNotMatch(message, /안내:/);
  assert.doesNotMatch(message, /예약 전 안내|예약금/);
  assert.doesNotMatch(message, /\[TimeOpen\]|TimeOpen|\[Web발신\]|샵:/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});

test("booking confirmation SMS omits optional location and link when empty", () => {
  const message = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "  ",
    manageUrl: "  ",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 확정",
      "",
      "젤네일, 6월 24일 11:20",
    ].join("\n")
  );
  assert.doesNotMatch(message, /위치:/);
  assert.doesNotMatch(message, /확인·취소:/);
});

test("booking confirmation SMS uses a natural fallback when shop name is missing", () => {
  const message = buildBookingConfirmationCustomerSms({
    shopName: "  ",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
  });

  assert.equal(
    message,
    [
      "예약 확정",
      "",
      "젤네일, 6월 24일 11:20",
    ].join("\n")
  );
  assert.doesNotMatch(message, /undefined|null|샵:/);
});

test("booking request SMS uses the compact customer format", () => {
  const manageUrl = "https://timeopen.app/r/k7Qp9xLm2A4z";
  const message = buildBookingRequestCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    bookingContact: "인스타 DM @time_nail",
    manageUrl,
  });

  assert.equal(
    message,
    [
      "타임네일 예약 요청 접수",
      "",
      "젤네일, 6월 24일 11:20",
      "서울시 마포구 2층",
      "",
      "확인·취소",
      "https://timeopen.app/r/k7Qp9xLm2A4z",
      "",
      "샵에서 확인 후 확정 안내를 보내드릴게요.",
    ].join("\n")
  );
  assertManageUrlLine(message, manageUrl);
  assert.doesNotMatch(message, /확인·취소:/);
  assert.doesNotMatch(message, /서비스:|일시:|위치:/);
  assert.doesNotMatch(message, /문의:/);
  assert.doesNotMatch(message, /안내:/);
  assert.doesNotMatch(message, /예약 전 안내|예약금|10분 전 도착/);
  assert.doesNotMatch(message, /\[TimeOpen\]|TimeOpen|\[Web발신\]|샵:/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});

test("booking request SMS omits optional location and link when empty", () => {
  const message = buildBookingRequestCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "  ",
    manageUrl: "  ",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 요청 접수",
      "",
      "젤네일, 6월 24일 11:20",
      "",
      "샵에서 확인 후 확정 안내를 보내드릴게요.",
    ].join("\n")
  );
  assert.doesNotMatch(message, /위치:/);
  assert.doesNotMatch(message, /확인·취소:/);
});

test("booking changed SMS uses the compact customer format", () => {
  const manageUrl = "https://timeopen.app/r/k7Qp9xLm2A4z";
  const message = buildBookingChangedCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    manageUrl,
  });

  assert.equal(
    message,
    [
      "타임네일 예약 변경",
      "",
      "젤네일, 6월 24일 11:20",
      "",
      "확인·취소",
      "https://timeopen.app/r/k7Qp9xLm2A4z",
    ].join("\n")
  );
  assertManageUrlLine(message, manageUrl);
  assert.doesNotMatch(message, /확인·취소:/);
  assert.doesNotMatch(message, /서비스:|일시:/);
  assert.doesNotMatch(message, /위치:|문의:|안내:|예약 전 안내|예약금/);
});

test("booking changed SMS omits manage link when empty", () => {
  const message = buildBookingChangedCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 변경",
      "",
      "젤네일, 6월 24일 11:20",
    ].join("\n")
  );
  assert.doesNotMatch(message, /확인·취소:/);
});

test("booking cancelled SMS uses compact copy and includes inquiry contact only when set", () => {
  const message = buildBookingCancelledCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    bookingContact: "010-1234-5678",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 취소",
      "",
      "젤네일, 6월 24일 11:20",
      "문의: 010-1234-5678",
    ].join("\n")
  );
  assert.doesNotMatch(message, /위치:|확인·취소:|안내:|예약 전 안내|예약금/);
  assert.doesNotMatch(message, /\[TimeOpen\]|TimeOpen|\[Web발신\]|샵:/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});

test("booking cancelled SMS omits inquiry contact when empty", () => {
  const message = buildBookingCancelledCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    bookingContact: "  ",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 취소",
      "",
      "젤네일, 6월 24일 11:20",
    ].join("\n")
  );
  assert.doesNotMatch(message, /문의:/);
});

test("owner new reservation SMS is short and includes customer contact", () => {
  const message = buildOwnerNewReservationSms({
    customerName: "김고객",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    customerPhone: "010-1111-2222",
  });

  assert.equal(
    message,
    [
      "새 예약이 들어왔어요.",
      "",
      "고객: 김고객",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
      "연락처: 010-1111-2222",
    ].join("\n")
  );
  assert.doesNotMatch(message, /\[TimeOpen\]|TimeOpen|예약금|위치:|안내:/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});

test("owner requested reservation SMS asks owner to confirm in reservation management", () => {
  const message = buildOwnerReservationRequestSms({
    customerName: "김고객",
    serviceName: "속눈썹펌",
    dateTime: "6월 24일 11:20",
    customerPhone: "010-1111-2222",
  });

  assert.equal(
    message,
    [
      "확인 대기 예약이 들어왔어요.",
      "",
      "고객: 김고객",
      "서비스: 속눈썹펌",
      "일시: 6월 24일 11:20",
      "연락처: 010-1111-2222",
      "",
      "예약관리에서 확정해주세요.",
    ].join("\n")
  );
  assert.doesNotMatch(message, /\[TimeOpen\]|TimeOpen|예약금|위치:|안내:/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});

test("owner cancellation SMS includes customer contact", () => {
  const message = buildOwnerCancellationSms({
    customerName: "김고객",
    serviceName: "케어",
    dateTime: "6월 24일 11:20",
    customerPhone: "010-1111-2222",
  });

  assert.equal(
    message,
    [
      "고객이 예약을 취소했어요.",
      "",
      "고객: 김고객",
      "서비스: 케어",
      "일시: 6월 24일 11:20",
      "연락처: 010-1111-2222",
    ].join("\n")
  );
  assert.doesNotMatch(message, /\[TimeOpen\]|TimeOpen|예약금|위치:|안내:/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});
