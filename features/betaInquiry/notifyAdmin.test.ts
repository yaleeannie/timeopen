import assert from "node:assert/strict";
import test from "node:test";
import { betaInquiryEmailForTest } from "./notifyAdmin";

test("formats beta inquiry admin email text in Korean", () => {
  const text = betaInquiryEmailForTest.formatPlainText(
    {
      name: "김사장",
      contact: "@time_nail",
      shop_name: "타임네일",
      shop_type: "네일샵",
      current_booking_method: "인스타 DM",
      pain_point: "시간 조율",
      monthly_booking_volume: "30~100건",
      message: "베타 안내 부탁드려요.",
    },
    new Date("2026-06-23T03:00:00.000Z")
  );

  assert.match(text, /\[TimeOpen\] 새로운 베타 파트너 신청/);
  assert.match(text, /신청일:/);
  assert.match(text, /이름: 김사장/);
  assert.match(text, /연락처: @time_nail/);
  assert.match(text, /월 예약 건수: 30~100건/);
});
