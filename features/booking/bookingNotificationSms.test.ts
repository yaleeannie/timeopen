import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBookingConfirmationCustomerSms,
  buildBookingRequestCustomerSms,
} from "./bookingNotificationSms";

test("booking confirmation SMS includes booking inquiry contact when set", () => {
  const message = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    noticeText: "10분 전 도착 부탁드립니다.",
    bookingContact: "010-1234-5678",
  });

  assert.equal(
    message,
    [
      "[TimeOpen] 예약이 확정되었어요.",
      "",
      "샵: 타임네일",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
      "위치: 서울시 마포구 2층",
      "안내: 10분 전 도착 부탁드립니다.",
      "문의: 010-1234-5678",
    ].join("\n")
  );
  assert.equal(message.match(/\[TimeOpen\]/g)?.length, 1);
  assert.equal(message.startsWith("[TimeOpen] 예약이 확정되었어요."), true);
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
  assert.equal(message.match(/\[TimeOpen\]/g)?.length, 1);
});

test("booking request SMS uses request copy", () => {
  const message = buildBookingRequestCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    locationText: "서울시 마포구 2층",
    bookingContact: "인스타 DM @time_nail",
  });

  assert.equal(
    message,
    [
      "[TimeOpen] 예약 요청이 접수되었어요.",
      "",
      "샵: 타임네일",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
      "위치: 서울시 마포구 2층",
      "문의: 인스타 DM @time_nail",
      "",
      "샵에서 확인 후 예약 확정 안내를 보내드릴게요.",
    ].join("\n")
  );
  assert.equal(message.match(/\[TimeOpen\]/g)?.length, 1);
  assert.equal(message.startsWith("[TimeOpen] 예약 요청이 접수되었어요."), true);
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
