import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260626110000_add_owner_confirmation_booking_mode.sql",
    import.meta.url
  ),
  "utf8"
);

test("booking confirmation mode defaults to automatic and includes booking notice", () => {
  assert.match(
    migrationSql,
    /booking_confirmation_mode text not null default 'automatic'/
  );
  assert.match(migrationSql, /booking_notice text null/);
  assert.match(migrationSql, /check \(booking_confirmation_mode in \('manual', 'automatic'\)\)/);
});

test("public reservation RPC creates requested or confirmed by organization mode", () => {
  assert.match(migrationSql, /coalesce\(o\.booking_confirmation_mode, 'automatic'\)/);
  assert.match(migrationSql, /when v_booking_confirmation_mode = 'automatic' then 'confirmed'/);
  assert.match(migrationSql, /else 'requested'/);
  assert.match(migrationSql, /v_status,/);
});

test("public confirmation RPC returns booking notice for completion page", () => {
  assert.match(migrationSql, /booking_notice text/);
  assert.match(migrationSql, /coalesce\(o\.booking_notice, ''\)::text/);
});

test("requested reservations still block availability", () => {
  assert.match(
    migrationSql,
    /coalesce\(r\.status, 'confirmed'\) not in \('cancelled', 'canceled'\)/
  );
});

test("owner confirm RPC is owner scoped and only confirms requested reservations", () => {
  assert.match(migrationSql, /create or replace function public\.confirm_owner_reservation/);
  assert.match(migrationSql, /m\.role in \('owner', 'member'\)/);
  assert.match(migrationSql, /if v_current_status <> 'requested' then/);
  assert.match(migrationSql, /set status = 'confirmed'/);
});
