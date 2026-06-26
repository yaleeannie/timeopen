import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260626100000_reserve_old_booking_handles.sql",
    import.meta.url
  ),
  "utf8"
);

test("handle history migration reserves old booking handles", () => {
  assert.match(migrationSql, /create table if not exists public\.organization_handle_history/);
  assert.match(migrationSql, /create unique index if not exists organization_handle_history_lower_handle_key/);
  assert.match(migrationSql, /on public\.organization_handle_history \(lower\(handle\)\)/);
});

test("handle availability rejects other organizations' handle history", () => {
  assert.match(migrationSql, /create or replace function public\.check_organization_handle_availability/);
  assert.match(migrationSql, /v_history_owner is not null and v_history_owner <> p_organization_id/);
  assert.match(migrationSql, /이미 사용 중이거나 더 이상 사용할 수 없는 링크예요/);
  assert.match(migrationSql, /v_history_owner = p_organization_id/);
});

test("handle change stores previous handle and enforces cooldown", () => {
  assert.match(migrationSql, /create or replace function public\.change_organization_handle/);
  assert.match(migrationSql, /v_handle_changed_at \+ interval '14 days'/);
  assert.match(migrationSql, /예약 링크는 14일에 한 번만 변경할 수 있어요/);
  assert.match(migrationSql, /insert into public\.organization_handle_history \(organization_id, handle\)/);
  assert.match(migrationSql, /set handle = v_handle,\s+handle_changed_at = now\(\)/);
});
