import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bookingScreen = readFileSync(
  new URL("./components/BookingScreen.tsx", import.meta.url),
  "utf8"
);
const publicConfirmedPage = readFileSync(
  new URL("./components/PublicConfirmedPage.tsx", import.meta.url),
  "utf8"
);
const notifyBookingRoute = readFileSync(
  new URL("../../app/api/notify/booking/route.ts", import.meta.url),
  "utf8"
);
const reservationUpdateRoute = readFileSync(
  new URL("../../app/api/reservations/update/route.ts", import.meta.url),
  "utf8"
);

test("booking notice is shown before public booking submit as pre-booking guidance", () => {
  assert.match(bookingScreen, /예약 전 안내/);
  assert.match(bookingScreen, /orgBookingNotice/);
});

test("completion page separates pre-booking, visit, location, and contact guidance", () => {
  assert.match(publicConfirmedPage, /예약 전 안내/);
  assert.match(publicConfirmedPage, /방문 안내/);
  assert.match(publicConfirmedPage, /위치 안내/);
  assert.match(publicConfirmedPage, /예약 문의/);
});

test("booking notice is never read into customer SMS routes", () => {
  assert.doesNotMatch(notifyBookingRoute, /reservation\.booking_notice/);
  assert.doesNotMatch(reservationUpdateRoute, /booking_notice/);
});
