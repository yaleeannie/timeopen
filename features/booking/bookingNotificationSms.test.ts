import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBookingCancelledCustomerSms,
  buildBookingConfirmationCustomerSms,
  buildBookingRequestCustomerSms,
  buildOwnerCancellationSms,
  buildOwnerNewReservationSms,
  buildOwnerReservationRequestSms,
} from "./bookingNotificationSms";

test("booking confirmation SMS includes booking inquiry contact when set", () => {
  const message = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    noticeText: "10분 전 도착 부탁드립니다.",
    bookingContact: "010-1234-5678",
    manageUrl: "https://timeopen.app/r/token123",
  });

  assert.equal(
    message,
    [
      "타임네일 예약이 확정되었어요.",
      "",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
      "위치: 서울시 마포구 2층",
      "안내: 10분 전 도착 부탁드립니다.",
      "문의: 010-1234-5678",
      "예약 확인/취소: https://timeopen.app/r/token123",
    ].join("\n")
  );
  assert.doesNotMatch(message, /\[TimeOpen\]/);
  assert.doesNotMatch(message, /TimeOpen/);
  assert.doesNotMatch(message, /샵:/);
  assert.equal(message.startsWith("타임네일 예약이 확정되었어요."), true);
  assert.doesNotMatch(message, /\[Web발신\]/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});

test("booking confirmation SMS omits inquiry contact when empty", () => {
  const message = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    bookingContact: "  ",
  });

  assert.doesNotMatch(message, /문의/);
  assert.doesNotMatch(message, /\[TimeOpen\]/);
  assert.doesNotMatch(message, /TimeOpen/);
  assert.doesNotMatch(message, /샵:/);
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
      "예약이 확정되었어요.",
      "",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
    ].join("\n")
  );
  assert.doesNotMatch(message, /undefined/);
  assert.doesNotMatch(message, /null/);
  assert.doesNotMatch(message, /샵:/);
});

test("booking request SMS uses request copy", () => {
  const message = buildBookingRequestCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    bookingContact: "인스타 DM @time_nail",
    manageUrl: "https://timeopen.app/r/token123",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 요청이 접수되었어요.",
      "",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
      "위치: 서울시 마포구 2층",
      "문의: 인스타 DM @time_nail",
      "예약 확인/취소: https://timeopen.app/r/token123",
      "",
      "샵에서 확인 후 예약 확정 안내를 보내드릴게요.",
    ].join("\n")
  );
  assert.doesNotMatch(message, /\[TimeOpen\]/);
  assert.doesNotMatch(message, /TimeOpen/);
  assert.doesNotMatch(message, /샵:/);
  assert.equal(message.startsWith("타임네일 예약 요청이 접수되었어요."), true);
  assert.doesNotMatch(message, /\[Web발신\]/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
  assert.doesNotMatch(message, /예약금/);
  assert.doesNotMatch(message, /10분 전 도착/);
});

test("booking SMS policy keeps booking notice out of customer SMS", () => {
  const confirmation = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    noticeText: "10분 전 도착 부탁드립니다.",
    bookingContact: "010-1234-5678",
  });
  const request = buildBookingRequestCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    bookingContact: "010-1234-5678",
  });

  assert.match(confirmation, /위치: 서울시 마포구 2층/);
  assert.match(confirmation, /안내: 10분 전 도착 부탁드립니다\./);
  assert.match(confirmation, /문의: 010-1234-5678/);
  assert.doesNotMatch(confirmation, /예약 전 안내/);
  assert.doesNotMatch(confirmation, /예약금/);

  assert.match(request, /위치: 서울시 마포구 2층/);
  assert.match(request, /문의: 010-1234-5678/);
  assert.doesNotMatch(request, /안내:/);
  assert.doesNotMatch(request, /예약금/);
});

test("booking cancelled SMS uses shop-first customer copy", () => {
  const message = buildBookingCancelledCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    bookingContact: "010-1234-5678",
  });

  assert.equal(
    message,
    [
      "타임네일 예약이 취소되었어요.",
      "",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
      "문의: 010-1234-5678",
    ].join("\n")
  );
  assert.doesNotMatch(message, /\[TimeOpen\]/);
  assert.doesNotMatch(message, /TimeOpen/);
  assert.doesNotMatch(message, /샵:/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
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
