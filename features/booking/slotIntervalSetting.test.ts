import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260710090000_add_booking_slot_interval.sql",
    import.meta.url
  ),
  "utf8"
);
const publicBookingPage = readFileSync(
  new URL("../../app/u/[handle]/page.tsx", import.meta.url),
  "utf8"
);
const publicBookingShell = readFileSync(
  new URL("../../features/booking/components/PublicBookingPage.tsx", import.meta.url),
  "utf8"
);
const bookingScreen = readFileSync(
  new URL("../../features/booking/components/BookingScreen.tsx", import.meta.url),
  "utf8"
);
const availabilityPage = readFileSync(
  new URL("../../app/settings/availability/page.tsx", import.meta.url),
  "utf8"
);
const availabilitySettings = readFileSync(
  new URL(
    "../../app/settings/availability/AvailabilitySettingsClient.tsx",
    import.meta.url
  ),
  "utf8"
);
const settingsRoute = readFileSync(
  new URL("../../app/api/settings/booking-slot-mode/route.ts", import.meta.url),
  "utf8"
);
const ownerSlotsRoute = readFileSync(
  new URL("../../app/api/reservations/slots/route.ts", import.meta.url),
  "utf8"
);

test("migration adds booking slot interval with 10-minute default and check constraint", () => {
  assert.match(
    migrationSql,
    /booking_slot_interval_min integer not null default 10/
  );
  assert.match(
    migrationSql,
    /check \(booking_slot_interval_min in \(10, 15, 30, 60\)\)/
  );
  assert.match(migrationSql, /booking_slot_interval_min integer/);
  assert.match(migrationSql, /o\.booking_slot_interval_min/);
});

test("public booking page uses organization interval for visible slot generation", () => {
  assert.match(publicBookingPage, /normalizeBookingSlotInterval/);
  assert.match(publicBookingPage, /organization\?\.booking_slot_interval_min/);
  assert.doesNotMatch(publicBookingPage, /normalizeBookingSlotMode/);
  assert.match(publicBookingShell, /bookingSlotIntervalMin/);
  assert.doesNotMatch(publicBookingShell, /bookingSlotMode/);
  assert.match(bookingScreen, /bookingSlotIntervalMin/);
  assert.match(bookingScreen, /intervalMin: bookingSlotIntervalMin/);
  assert.match(bookingScreen, /mode: "flexible"/);
});

test("owner availability settings expose and save Korean booking interval options", () => {
  assert.match(availabilityPage, /booking_slot_interval_min/);
  assert.doesNotMatch(availabilityPage, /booking_slot_mode,/);
  assert.match(availabilitySettings, /예약 시간 단위/);
  assert.match(availabilitySettings, /고객에게 보여줄 예약 가능 시간 간격이에요\./);
  assert.match(availabilitySettings, /BOOKING_SLOT_INTERVAL_OPTIONS/);
  assert.match(availabilitySettings, /booking_slot_interval_min: nextInterval/);
  assert.match(availabilitySettings, /option === 30/);
  assert.match(availabilitySettings, /추천/);
  assert.match(availabilitySettings, /json\?\.booking_slot_interval_min \?\? nextInterval/);
  assert.match(availabilitySettings, /setBookingSlotIntervalMin\(savedInterval\)/);
  assert.match(availabilitySettings, /예약 시간 단위를 저장 중\.\.\./);
  assert.match(
    availabilitySettings,
    /예약 시간 단위를 저장하지 못했어요\. 다시 시도해주세요\./
  );
});

test("owner availability settings hide booking slot mode UI", () => {
  assert.doesNotMatch(availabilitySettings, /예약 시간 표시 방식/);
  assert.doesNotMatch(availabilitySettings, /촘촘하게 받기/);
  assert.doesNotMatch(availabilitySettings, /딱 맞게 받기/);
  assert.doesNotMatch(availabilitySettings, /예: 90분 시술 기준/);
  assert.doesNotMatch(availabilitySettings, /saveBookingSlotMode/);
});

test("settings API validates and updates interval without requiring mode changes", () => {
  assert.match(settingsRoute, /validateBookingSlotInterval/);
  assert.match(settingsRoute, /booking_slot_interval_min/);
  assert.match(settingsRoute, /select\("booking_slot_mode, booking_slot_interval_min"\)/);
  assert.match(settingsRoute, /updatedOrganization\?\.booking_slot_interval_min/);
  assert.match(
    settingsRoute,
    /예약 시간 단위 저장 컬럼이 아직 적용되지 않았어요\. 로컬 DB에 최신 마이그레이션을 적용해주세요\./
  );
  assert.match(settingsRoute, /Object\.keys\(updates\)\.length === 0/);
});

test("owner reservation edit slots use the same organization interval", () => {
  assert.match(ownerSlotsRoute, /booking_slot_interval_min/);
  assert.doesNotMatch(ownerSlotsRoute, /booking_slot_mode,/);
  assert.match(ownerSlotsRoute, /normalizeBookingSlotInterval/);
  assert.match(ownerSlotsRoute, /intervalMin: bookingSlotIntervalMin/);
  assert.match(ownerSlotsRoute, /mode: "flexible"/);
});
