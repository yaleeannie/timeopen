import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const managePage = readFileSync(
  new URL("../../app/r/[token]/page.tsx", import.meta.url),
  "utf8"
);
const manageClient = readFileSync(
  new URL("../../app/r/[token]/ReservationManageClient.tsx", import.meta.url),
  "utf8"
);
const cancelRoute = readFileSync(
  new URL("../../app/api/reservations/public-cancel/route.ts", import.meta.url),
  "utf8"
);
const confirmedPage = readFileSync(
  new URL("../../features/booking/components/PublicConfirmedPage.tsx", import.meta.url),
  "utf8"
);

test("public reservation management page shows invalid-token not found copy", () => {
  assert.match(managePage, /get_public_reservation_by_manage_token/);
  assert.match(managePage, /예약 정보를 찾을 수 없어요/);
});

test("customer cancellation UI shows cutoff and change inquiry guidance", () => {
  assert.match(manageClient, /예약 시간 3일 전까지/);
  assert.match(manageClient, /예약 시간이 가까워 직접 취소가 어려워요/);
  assert.match(manageClient, /예약 변경이 필요하면 샵에 문의해주세요/);
  assert.match(manageClient, /예약을 취소하시겠어요/);
});

test("customer cancellation route uses token RPC and does not rely on client cutoff", () => {
  assert.match(cancelRoute, /cancel_public_reservation_by_manage_token/);
  assert.match(cancelRoute, /예약은 취소됐지만 문자 발송에 실패했어요/);
  assert.match(cancelRoute, /buildBookingCancelledCustomerSms/);
});

test("completion page exposes reservation management link and copy action", () => {
  assert.match(confirmedPage, /예약 확인\/취소 링크/);
  assert.match(confirmedPage, /링크 복사/);
  assert.match(confirmedPage, /navigator\.clipboard\.writeText/);
});
