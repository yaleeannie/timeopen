import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260630160000_add_owner_sms_notifications.sql",
    import.meta.url
  ),
  "utf8"
);

const notifyRoute = readFileSync(
  new URL("../../app/api/notify/booking/route.ts", import.meta.url),
  "utf8"
);

const publicCancelRoute = readFileSync(
  new URL("../../app/api/reservations/public-cancel/route.ts", import.meta.url),
  "utf8"
);

const profileEditor = readFileSync(
  new URL("../../app/owner/ProfileEditor.tsx", import.meta.url),
  "utf8"
);

const updateProfileRoute = readFileSync(
  new URL("../../app/api/owner/update-profile/route.ts", import.meta.url),
  "utf8"
);

test("owner SMS notifications are disabled by default and use a separate phone field", () => {
  assert.match(
    migrationSql,
    /owner_sms_notifications_enabled boolean not null default false/
  );
  assert.match(migrationSql, /owner_notification_phone text null/);
  assert.match(migrationSql, /Do not fall back to owner email or customer-facing booking_contact/);
});

test("public booking confirmation RPC exposes owner SMS settings", () => {
  assert.match(migrationSql, /owner_sms_notifications_enabled boolean/);
  assert.match(migrationSql, /owner_notification_phone text/);
  assert.match(
    migrationSql,
    /coalesce\(o\.owner_sms_notifications_enabled, false\)::boolean/
  );
});

test("owner SMS is sent only when enabled and phone is configured", () => {
  assert.match(
    notifyRoute,
    /const ownerSmsEnabled = reservation\.owner_sms_notifications_enabled === true/
  );
  assert.match(
    notifyRoute,
    /const ownerPhone = ownerSmsEnabled \? clean\(reservation\.owner_notification_phone\) : ""/
  );
  assert.doesNotMatch(notifyRoute, /process\.env\.OWNER_PHONE/);
});

test("automatic and requested booking paths use distinct owner SMS builders", () => {
  assert.match(notifyRoute, /buildOwnerNewReservationSms/);
  assert.match(notifyRoute, /buildOwnerReservationRequestSms/);
  assert.match(notifyRoute, /reservationStatus === "requested"/);
});

test("customer cancellation can send owner SMS without blocking cancellation", () => {
  assert.match(publicCancelRoute, /buildOwnerCancellationSms/);
  assert.match(publicCancelRoute, /owner_sms_notifications_enabled === true/);
  assert.match(publicCancelRoute, /console\.error\("\[public-cancel\] owner sms failed"/);
  assert.match(publicCancelRoute, /return NextResponse\.json\(\{\s*ok: true/s);
});

test("profile UI exposes compact owner SMS notification settings", () => {
  assert.match(profileEditor, /사장님 알림/);
  assert.match(profileEditor, /문자 알림 받기/);
  assert.match(profileEditor, /알림 받을 연락처/);
  assert.match(profileEditor, /새 예약, 확인 대기 예약, 고객 취소가 생기면 이 번호로 알려드려요\./);
});

test("profile save requires owner notification phone only when toggle is on", () => {
  assert.match(updateProfileRoute, /owner_sms_notifications_enabled/);
  assert.match(updateProfileRoute, /owner_notification_phone/);
  assert.match(
    updateProfileRoute,
    /if \(owner_sms_notifications_enabled && !owner_notification_phone\)/
  );
});
