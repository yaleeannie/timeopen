import assert from "node:assert/strict";
import test from "node:test";
import { buildBookingConfirmationCustomerSms } from "./bookingNotificationSms";

test("booking confirmation SMS includes booking inquiry contact when set", () => {
  const message = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    bookingContact: "010-1234-5678",
  });

  assert.match(message, /타임네일 예약이 확정되었습니다/);
  assert.match(message, /문의\n010-1234-5678/);
});

test("booking confirmation SMS omits inquiry contact when empty", () => {
  const message = buildBookingConfirmationCustomerSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    bookingContact: "  ",
  });

  assert.doesNotMatch(message, /문의/);
});
