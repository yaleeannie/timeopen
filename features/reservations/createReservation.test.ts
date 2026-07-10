import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  manualReservationCreateDoesNotNotifyOwner,
  validateReservationCreateInput,
} from "./createReservation";

const reservationsClientSource = readFileSync(
  new URL("../../app/reservations/ReservationsClient.tsx", import.meta.url),
  "utf8"
);
const createRouteSource = readFileSync(
  new URL("../../app/api/reservations/create/route.ts", import.meta.url),
  "utf8"
);
const slotsRouteSource = readFileSync(
  new URL("../../app/api/reservations/slots/route.ts", import.meta.url),
  "utf8"
);

test("validates owner-created reservation input", () => {
  const validation = validateReservationCreateInput({
    serviceId: "svc_1",
    customerName: "김고객",
    customerPhone: "010-1234-5678",
    date: "2026-07-10",
    startTime: "09:30",
    sendCustomerSms: true,
  });

  assert.equal(validation.ok, true);
  if (!validation.ok) return;

  assert.deepEqual(validation.value, {
    serviceId: "svc_1",
    customerName: "김고객",
    customerPhone: "010-1234-5678",
    date: "2026-07-10",
    startTime: "09:30",
    sendCustomerSms: true,
  });
});

test("owner-created reservation validation rejects missing required fields", () => {
  assert.equal(
    validateReservationCreateInput({
      serviceId: "",
      customerName: "김고객",
      customerPhone: "010-1234-5678",
      date: "2026-07-10",
      startTime: "09:30",
      sendCustomerSms: false,
    }).ok,
    false
  );
  assert.equal(
    validateReservationCreateInput({
      serviceId: "svc_1",
      customerName: "김고객",
      customerPhone: "",
      date: "2026-07-10",
      startTime: "09:30",
      sendCustomerSms: false,
    }).ok,
    false
  );
  assert.equal(
    validateReservationCreateInput({
      serviceId: "svc_1",
      customerName: "김고객",
      customerPhone: "010-1234-5678",
      date: "2026-99-99",
      startTime: "09:30",
      sendCustomerSms: false,
    }).ok,
    false
  );
  assert.equal(
    validateReservationCreateInput({
      serviceId: "svc_1",
      customerName: "김고객",
      customerPhone: "010-1234-5678",
      date: "2026-07-10",
      startTime: "24:00",
      sendCustomerSms: false,
    }).ok,
    false
  );
});

test("reservation management page renders owner reservation creation flow", () => {
  assert.match(reservationsClientSource, /function ManualReservationCreator/);
  assert.match(reservationsClientSource, /예약 추가/);
  assert.match(reservationsClientSource, /서비스 선택/);
  assert.match(reservationsClientSource, /날짜 선택/);
  assert.match(reservationsClientSource, /예약 가능한 시간/);
  assert.match(reservationsClientSource, /고객 이름/);
  assert.match(reservationsClientSource, /고객 연락처/);
  assert.match(reservationsClientSource, /고객에게 예약 확정 문자 보내기/);
  assert.match(reservationsClientSource, /예약 추가 중\.\.\./);
});

test("manual reservation slot picker reuses owner slots endpoint without edit reservation id", () => {
  assert.match(reservationsClientSource, /fetch\("\/api\/reservations\/slots"/);
  assert.match(
    reservationsClientSource,
    /body: JSON\.stringify\(\{\s+serviceId: form\.serviceId,\s+date: form\.date,\s+\}\)/s
  );
});

test("owner slots endpoint supports create mode and configured interval", () => {
  assert.match(slotsRouteSource, /getOwnerContext/);
  assert.match(slotsRouteSource, /if \(reservationId\)/);
  assert.match(slotsRouteSource, /\.neq\("id", reservationId\)/);
  assert.match(slotsRouteSource, /booking_slot_interval_min/);
  assert.match(slotsRouteSource, /mode: "flexible"/);
  assert.match(slotsRouteSource, /intervalMin: bookingSlotIntervalMin/);
});

test("owner reservation create API defaults SMS off and only sends when requested", () => {
  assert.match(createRouteSource, /create_owner_reservation/);
  assert.match(createRouteSource, /sendCustomerSms/);
  assert.match(createRouteSource, /buildBookingConfirmationCustomerSms/);
  assert.match(createRouteSource, /예약이 추가되었어요\./);
  assert.match(createRouteSource, /예약은 추가됐지만 문자 발송에 실패했어요\./);
  assert.equal(manualReservationCreateDoesNotNotifyOwner(createRouteSource), true);
});
