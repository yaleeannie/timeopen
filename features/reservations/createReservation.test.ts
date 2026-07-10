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
const manualReservationCreatorSource = reservationsClientSource.slice(
  reservationsClientSource.indexOf("function ManualReservationCreator"),
  reservationsClientSource.indexOf("function ReservationCard")
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

test("owner reservation success toast auto-dismisses and cleans up its timer", () => {
  assert.match(
    reservationsClientSource,
    /useEffect\(\(\) => \{\s+if \(!toast\) return;[\s\S]+window\.setTimeout\(\(\) => \{\s+setToast\(null\);[\s\S]+2800\);[\s\S]+return \(\) => window\.clearTimeout\(timer\);[\s\S]+\}, \[toast\]\);/s
  );
  assert.match(
    reservationsClientSource,
    /function resetAndClose\(options\?: \{ keepToast\?: boolean \}\)/
  );
  assert.match(reservationsClientSource, /if \(!options\?\.keepToast\)/);
  assert.match(reservationsClientSource, /resetAndClose\(\{ keepToast: true \}\)/);
  assert.match(reservationsClientSource, /role="status"/);
  assert.match(reservationsClientSource, /fixed left-1\/2 top-1\/2 z-\[100\]/);
  assert.match(reservationsClientSource, /-translate-x-1\/2 -translate-y-1\/2/);
  assert.match(reservationsClientSource, /max-w-\[calc\(100vw-32px\)\]/);
  assert.match(reservationsClientSource, /flex-col items-center justify-center/);
  assert.doesNotMatch(
    manualReservationCreatorSource,
    /mb-3 rounded-2xl bg-\[#e8fbff\]/
  );
});

test("owner reservation toast formats long SMS messages as explicit lines", () => {
  assert.match(reservationsClientSource, /function getReservationToastLines/);
  assert.match(
    reservationsClientSource,
    /return \["예약이 추가됐고", "고객에게 안내 문자를 보냈어요\."\]/
  );
  assert.match(
    reservationsClientSource,
    /return \["예약은 추가됐지만", "문자 발송에 실패했어요\."\]/
  );
  assert.match(reservationsClientSource, /getReservationToastLines\(toast\.message\)\.map/);
  assert.match(reservationsClientSource, /className="block"/);
});

test("owner reservation creation modal uses a light solid TimeOpen style", () => {
  assert.match(reservationsClientSource, /bg-slate-900\/10/);
  assert.match(reservationsClientSource, /backdrop-blur-\[1px\]/);
  assert.match(reservationsClientSource, /border border-sky-100 bg-white/);
  assert.match(reservationsClientSource, /shadow-\[0_24px_80px_rgba\(14,165,233,0\.12\)\]/);
  assert.match(reservationsClientSource, /border-slate-200 bg-white text-slate-700/);
  assert.match(reservationsClientSource, /border-sky-300 bg-sky-50 text-slate-900/);
  assert.match(reservationsClientSource, /border-sky-500 bg-sky-500 text-white/);
  assert.match(reservationsClientSource, /border-slate-200 bg-sky-50\/50/);
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
