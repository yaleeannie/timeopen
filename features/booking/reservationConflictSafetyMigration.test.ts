import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260630150000_audit_reservation_conflict_safety.sql",
    import.meta.url
  ),
  "utf8"
);

test("reservation creation uses an organization-date transaction lock before conflict check", () => {
  assert.match(migrationSql, /create or replace function public\.create_reservation_by_handle/);
  assert.match(migrationSql, /pg_catalog\.pg_advisory_xact_lock/);
  assert.match(migrationSql, /hashtextextended\(v_organization_id::text \|\| ':' \|\| p_date::text, 0\)/);

  const lockIndex = migrationSql.indexOf("pg_catalog.pg_advisory_xact_lock");
  const conflictIndex = migrationSql.indexOf("if exists (");
  assert.ok(lockIndex >= 0, "creation RPC must acquire an advisory lock");
  assert.ok(conflictIndex >= 0, "creation RPC must keep conflict validation");
  assert.ok(lockIndex < conflictIndex, "creation RPC must lock before conflict validation");
});

test("reservation creation treats requested, confirmed, and legacy null status as busy", () => {
  assert.match(
    migrationSql,
    /coalesce\(r\.status, 'confirmed'\) not in \('cancelled', 'canceled'\)/
  );
});

test("reservation creation uses stored reservation buffer for existing busy intervals", () => {
  assert.match(
    migrationSql,
    /p_start < \(r\.end_time::time \+ make_interval\(mins => coalesce\(r\.buffer_min, 0\)\)\)::time/
  );
  assert.match(
    migrationSql,
    /r\.start_time::time < \(p_end::time \+ make_interval\(mins => p_buffer_min\)\)::time/
  );
});

test("reservation creation allows exact boundary end-start by using strict overlap comparisons", () => {
  assert.match(migrationSql, /p_start < \(r\.end_time::time/);
  assert.match(migrationSql, /r\.start_time::time < \(p_end::time/);
  assert.doesNotMatch(migrationSql, /p_start <= \(r\.end_time::time/);
  assert.doesNotMatch(migrationSql, /r\.start_time::time <= \(p_end::time/);
});

test("owner reservation edit locks, excludes itself, and rejects other active conflicts", () => {
  const updateDefinition = migrationSql.match(
    /create or replace function public\.update_owner_reservation[\s\S]*?grant execute on function public\.update_owner_reservation/
  )?.[0] ?? "";

  assert.match(updateDefinition, /pg_catalog\.pg_advisory_xact_lock/);
  assert.match(updateDefinition, /r\.id <> p_reservation_id/);
  assert.match(
    updateDefinition,
    /coalesce\(r\.status, 'confirmed'\) not in \('cancelled', 'canceled'\)/
  );
  assert.match(
    updateDefinition,
    /p_start < \(r\.end_time::time \+ make_interval\(mins => coalesce\(r\.buffer_min, 0\)\)\)::time/
  );
  assert.match(
    updateDefinition,
    /r\.start_time::time < \(v_end::time \+ make_interval\(mins => v_buffer_min\)\)::time/
  );
});

test("reservation creation keeps cryptographically random management tokens", () => {
  assert.match(migrationSql, /create extension if not exists pgcrypto with schema extensions/);
  assert.match(migrationSql, /encode\(extensions\.gen_random_bytes\(32\), 'hex'\)/);
});
