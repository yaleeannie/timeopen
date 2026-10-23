import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  isDatabaseMaintenanceError,
  isMaintenanceMode,
} from "@/lib/maintenance";

test("maintenance mode is opt-in and accepts case-insensitive true", () => {
  const previous = process.env.TIMEOPEN_MAINTENANCE_MODE;
  try {
    delete process.env.TIMEOPEN_MAINTENANCE_MODE;
    assert.equal(isMaintenanceMode(), false);
    process.env.TIMEOPEN_MAINTENANCE_MODE = "false";
    assert.equal(isMaintenanceMode(), false);
    process.env.TIMEOPEN_MAINTENANCE_MODE = " TRUE ";
    assert.equal(isMaintenanceMode(), true);
  } finally {
    if (previous === undefined) delete process.env.TIMEOPEN_MAINTENANCE_MODE;
    else process.env.TIMEOPEN_MAINTENANCE_MODE = previous;
  }
});

test("database guard failures are identified for a maintenance response", () => {
  assert.equal(
    isDatabaseMaintenanceError({
      code: "P0001",
      message: "TIMEOPEN_MAINTENANCE_MODE: new records are paused",
    }),
    true
  );
  assert.equal(
    isDatabaseMaintenanceError("TIMEOPEN_MAINTENANCE_MODE: new records are paused"),
    true
  );
  assert.equal(isDatabaseMaintenanceError({ code: "P0001", message: "other" }), false);
});

test("maintenance middleware preserves logged-in access and customer manage links", () => {
  const source = readFileSync(new URL("../../middleware.ts", import.meta.url), "utf8");
  assert.match(source, /if \(isMaintenanceMode\(\) && !user/);
  assert.match(source, /publicBookingPath \|\| publicSignupPath/);
  assert.match(source, /url\.pathname === "\/api\/reservations\/create"/);
  assert.match(source, /pathname\.startsWith\("\/r\/"\)/);
  assert.match(source, /pathname === "\/api\/reservations\/public-cancel"/);
  assert.match(source, /maintenanceApiResponse/);
});

test("public reservation creation has a server-side maintenance guard", () => {
  const source = readFileSync(
    new URL("../../app/api/reservations/public-create/route.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /if \(isMaintenanceMode\(\)\)/);
  assert.match(source, /maintenanceApiResponse/);
  assert.match(source, /create_reservation_by_handle/);
});

test("owner-created reservations, bootstrap, and onboarding setup are server-guarded", () => {
  const paths = [
    "../../app/api/reservations/create/route.ts",
    "../../app/api/bootstrap/route.ts",
    "../../app/api/onboarding/service/route.ts",
  ];
  for (const path of paths) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /if \(isMaintenanceMode\(\)\)/, path);
    assert.match(source, /maintenanceApiResponse/, path);
  }
});

test("maintenance magic-link login cannot create a new auth user", () => {
  const source = readFileSync(
    new URL("../../app/api/auth/magic-link/route.ts", import.meta.url),
    "utf8"
  );
  assert.match(source, /shouldCreateUser: !isMaintenanceMode\(\)/);
});

test("database maintenance triggers guard INSERT only without changing RLS or RPC grants", () => {
  const migration = readFileSync(
    new URL("../../supabase/migrations/20261023090000_add_timeopen_maintenance_insert_guards.sql", import.meta.url),
    "utf8"
  );
  assert.match(migration, /create trigger timeopen_maintenance_guard_reservation_insert\s+before insert on public\.reservations/i);
  assert.match(migration, /create trigger timeopen_maintenance_guard_organization_insert\s+before insert on public\.organizations/i);
  assert.doesNotMatch(migration, /before\s+(?:update|delete)|after\s+(?:update|delete)/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /revoke all on schema timeopen_private from public, anon, authenticated, service_role/i);
  assert.match(migration, /revoke all on table timeopen_private\.service_control\s+from public, anon, authenticated, service_role/i);
  assert.match(migration, /if v_maintenance_mode then[\s\S]*?raise exception 'TIMEOPEN_MAINTENANCE_MODE/i);
  assert.match(migration, /if not found then[\s\S]*?raise exception 'TimeOpen maintenance configuration is missing/i);
  assert.match(migration, /pg_advisory_xact_lock_shared/);
});

test("active reservation and shop creation paths reach guarded database INSERTs", () => {
  const publicCreateMigration = readFileSync(
    new URL("../../supabase/migrations/20260710130000_add_reservation_time_blocks.sql", import.meta.url),
    "utf8"
  );
  assert.match(publicCreateMigration, /create or replace function public\.create_reservation_by_handle/i);
  assert.match(publicCreateMigration, /insert into public\.reservations/i);
  assert.match(publicCreateMigration, /create(?: or replace)? function public\.create_owner_reservation/i);
  assert.match(publicCreateMigration, /insert into public\.reservations/i);

  const signup = readFileSync(new URL("../../app/signup/page.tsx", import.meta.url), "utf8");
  assert.match(signup, /supabase\.auth\.signUp/);
  const organizationCreation = readFileSync(
    new URL("../../features/organizations/createOrganization.ts", import.meta.url),
    "utf8"
  );
  assert.match(organizationCreation, /from\("organizations"\)[\s\S]*?\.insert\(/);
  const bootstrapMigration = readFileSync(
    new URL("../../supabase/migrations/20260623170000_fix_bootstrap_owner_for_email_signup.sql", import.meta.url),
    "utf8"
  );
  assert.match(bootstrapMigration, /insert into public\.organizations/i);
});

test("all SMS provider calls pass through the central suppression gate", () => {
  const sms = readFileSync(new URL("../../lib/notify/sendSms.ts", import.meta.url), "utf8");
  assert.match(sms, /export function isSmsDeliverySuppressed/);
  assert.match(sms, /if \(isSmsDeliverySuppressed\(\)\)[\s\S]*?throw new SmsDeliverySuppressedError/);
  assert.ok(sms.indexOf("if (isSmsDeliverySuppressed())") < sms.indexOf("await fetch("));
  const routes = [
    "../../app/api/notify/booking/route.ts",
    "../../app/api/reservations/create/route.ts",
    "../../app/api/reservations/confirm/route.ts",
    "../../app/api/reservations/update/route.ts",
    "../../app/api/reservations/cancel/route.ts",
    "../../app/api/reservations/public-cancel/route.ts",
  ];
  for (const path of routes) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.match(source, /sendSms/);
  }
});
