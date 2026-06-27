import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const bookingScreen = readFileSync(
  new URL("../../features/booking/components/BookingScreen.tsx", import.meta.url),
  "utf8"
);
const bookingCta = readFileSync(
  new URL("../../features/booking/components/BookingCta.tsx", import.meta.url),
  "utf8"
);
const publicBookingLoading = readFileSync(
  new URL("../../app/u/[handle]/loading.tsx", import.meta.url),
  "utf8"
);
const reservationsClient = readFileSync(
  new URL("../../app/reservations/ReservationsClient.tsx", import.meta.url),
  "utf8"
);
const profileEditor = readFileSync(
  new URL("../../app/owner/ProfileEditor.tsx", import.meta.url),
  "utf8"
);
const servicesEditor = readFileSync(
  new URL("../../app/owner/ServicesEditor.tsx", import.meta.url),
  "utf8"
);
const openSlotShareCard = readFileSync(
  new URL("../../app/owner/OpenSlotShareCard.tsx", import.meta.url),
  "utf8"
);

test("public booking submit has a duplicate-click guard and loading button", () => {
  assert.match(bookingScreen, /if \(isSubmittingReservation\) return/);
  assert.match(bookingScreen, /setIsSubmittingReservation\(true\)/);
  assert.match(bookingScreen, /loading=\{isSubmittingReservation\}/);
  assert.match(bookingCta, /loading \? "예약 중\.\.\." : t\("book"\)/);
});

test("public booking page exposes route and in-screen loading feedback", () => {
  assert.match(publicBookingLoading, /예약 페이지를 불러오는 중이에요\.\.\./);
  assert.match(publicBookingLoading, /TimeOpen/);
  assert.match(bookingScreen, /isInitialBookingLoading/);
  assert.match(bookingScreen, /<ServiceLoadingSkeleton \/>/);
  assert.match(bookingScreen, /<TimeLoadingSkeleton label=\{t\("loadingTimes"\)\} \/>/);
  assert.match(bookingScreen, /dateISO != null && time != null && !isTimesLoading && isTimesReadyForCurrent/);
});

test("owner reservation actions disable while async work is running", () => {
  assert.match(reservationsClient, /if \(confirming\) return/);
  assert.match(reservationsClient, /if \(saving\) return/);
  assert.match(reservationsClient, /disabled=\{cancelling\}/);
  assert.match(reservationsClient, /cancelling \? "취소 중\.\.\." : "예약 취소"/);
});

test("profile and service management actions expose loading states", () => {
  assert.match(profileEditor, /copyingHandle/);
  assert.match(profileEditor, /copyingHandle \? "복사 중\.\.\." : "링크 복사"/);
  assert.match(servicesEditor, /adding \? "저장 중\.\.\." : "서비스 저장"/);
  assert.match(servicesEditor, /savingEditId === row\.id \? "저장 중\.\.\." : "저장"/);
  assert.match(servicesEditor, /deletingId === row\.id \? "삭제 중\.\.\." : "삭제"/);
});

test("open slot share async buttons disable while copying or downloading", () => {
  assert.match(openSlotShareCard, /if \(copying\) return/);
  assert.match(openSlotShareCard, /if \(downloading\) return/);
  assert.match(openSlotShareCard, /copying \? "복사 중\.\.\."/);
  assert.match(openSlotShareCard, /downloading \? "저장 중\.\.\."/);
});
