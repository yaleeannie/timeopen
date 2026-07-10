import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260710120000_add_owner_manual_reservation_create_rpc.sql",
    import.meta.url
  ),
  "utf8"
);

test("manual reservation migration adds an authenticated owner RPC only", () => {
  assert.match(migration, /create function public\.create_owner_reservation/);
  assert.match(migration, /auth\.uid\(\)/);
  assert.match(migration, /organization_members/);
  assert.match(migration, /role in \('owner', 'member'\)/);
  assert.match(migration, /grant execute on function public\.create_owner_reservation[\s\S]+to authenticated/);
  assert.doesNotMatch(migration, /grant execute on function public\.create_owner_reservation[\s\S]+to anon/);
});

test("manual reservation RPC validates service ownership and active state", () => {
  assert.match(migration, /from public\.services as s/);
  assert.match(migration, /s\.active is true/);
  assert.match(migration, /v_duration_min/);
  assert.match(migration, /v_buffer_min/);
  assert.match(migration, /p_service_id/);
});

test("manual reservation RPC uses advisory locking and server-side conflict checks", () => {
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /hashtextextended/);
  assert.match(migration, /from public\.reservations as r/);
  assert.match(migration, /coalesce\(r\.status, 'confirmed'\) not in \('cancelled', 'canceled'\)/);
  assert.match(migration, /p_start < \(r\.end_time::time \+ make_interval[\s\S]+::time/);
  assert.match(migration, /r\.start_time::time < \(v_end::time \+ make_interval[\s\S]+::time/);
});

test("manual reservation RPC creates confirmed reservations with short manage tokens", () => {
  assert.match(migration, /status,/);
  assert.match(migration, /'confirmed'/);
  assert.match(migration, /public_manage_token/);
  assert.match(migration, /public_manage_token_created_at/);
  assert.match(migration, /extensions\.gen_random_bytes\(16\)/);
  assert.match(migration, /v_token_attempt >= 5/);
  assert.match(migration, /not exists \(/);
});
