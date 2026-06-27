import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReservationEditRpcPayload,
  buildReservationUpdatedSms,
  mutationDoesNotContainRestrictedReservationFields,
  validateReservationEditInput,
} from "./editReservation";

test("builds reservation edit payload without restricted fields", () => {
  const validation = validateReservationEditInput({
    reservationId: "00000000-0000-0000-0000-000000000001",
    serviceId: "service-1",
    customerName: "김고객",
    customerPhone: "+821012345678",
    date: "2026-06-24",
    startTime: "11:20",
  });

  assert.equal(validation.ok, true);
  if (!validation.ok) return;

  const payload = buildReservationEditRpcPayload(validation.value);

  assert.deepEqual(payload, {
    p_reservation_id: "00000000-0000-0000-0000-000000000001",
    p_service_id: "service-1",
    p_customer_name: "김고객",
    p_customer_phone: "+821012345678",
    p_date: "2026-06-24",
    p_start: "11:20",
  });
  assert.equal(mutationDoesNotContainRestrictedReservationFields(payload), true);
});

test("reservation edit validation rejects invalid date and time", () => {
  assert.equal(
    validateReservationEditInput({
      reservationId: "r1",
      serviceId: "s1",
      customerName: "김고객",
      customerPhone: "+821012345678",
      date: "2026-99-99",
      startTime: "11:20",
      endTime: "12:50",
    }).ok,
    false
  );
  assert.equal(
    validateReservationEditInput({
      reservationId: "r1",
      serviceId: "s1",
      customerName: "김고객",
      customerPhone: "+821012345678",
      date: "2026-06-24",
      startTime: "25:00",
    }).ok,
    false
  );
});

test("reservation update SMS copy is Korean and transactional", () => {
  const message = buildReservationUpdatedSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 정보가 변경되었어요.",
      "",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
    ].join("\n")
  );
  assert.doesNotMatch(message, /문의:/);
  assert.doesNotMatch(message, /위치:/);
  assert.doesNotMatch(message, /안내:/);
  assert.doesNotMatch(message, /예약금/);
  assert.doesNotMatch(message, /\[TimeOpen\]/);
  assert.doesNotMatch(message, /TimeOpen/);
  assert.doesNotMatch(message, /샵:/);
  assert.equal(message.startsWith("타임네일 예약 정보가 변경되었어요."), true);
  assert.doesNotMatch(message, /\[Web발신\]/);
  assert.doesNotMatch(message, /\d{1,2}:\d{2}:\d{2}/);
});

test("reservation update SMS includes booking inquiry contact when provided", () => {
  const message = buildReservationUpdatedSms({
    shopName: "타임네일",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
    bookingContact: "인스타 DM @time_nail",
  });

  assert.equal(
    message,
    [
      "타임네일 예약 정보가 변경되었어요.",
      "",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
      "문의: 인스타 DM @time_nail",
    ].join("\n")
  );
  assert.doesNotMatch(message, /\[TimeOpen\]/);
  assert.doesNotMatch(message, /TimeOpen/);
  assert.doesNotMatch(message, /샵:/);
  assert.equal(message.startsWith("타임네일 예약 정보가 변경되었어요."), true);
  assert.doesNotMatch(message, /\[Web발신\]/);
  assert.doesNotMatch(message, /위치:/);
  assert.doesNotMatch(message, /안내:/);
  assert.doesNotMatch(message, /예약금/);
});

test("reservation update SMS uses a natural fallback when shop name is missing", () => {
  const message = buildReservationUpdatedSms({
    shopName: " ",
    serviceName: "젤네일",
    dateTime: "6월 24일 11:20",
  });

  assert.equal(
    message,
    [
      "예약 정보가 변경되었어요.",
      "",
      "서비스: 젤네일",
      "일시: 6월 24일 11:20",
    ].join("\n")
  );
  assert.doesNotMatch(message, /undefined/);
  assert.doesNotMatch(message, /null/);
  assert.doesNotMatch(message, /샵:/);
});
