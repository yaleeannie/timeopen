import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260624180000_update_owner_reservation_with_service.sql",
    import.meta.url
  ),
  "utf8"
);

test("owner reservation update RPC is authenticated and owner scoped", () => {
  assert.match(migrationSql, /create or replace function public\.update_owner_reservation/);
  assert.match(migrationSql, /om\.user_id = auth\.uid\(\)/);
  assert.match(migrationSql, /om\.role in \('owner', 'member'\)/);
  assert.match(migrationSql, /grant execute on function public\.update_owner_reservation/s);
  assert.match(migrationSql, /to authenticated;/);
});

test("owner reservation update RPC only mutates editable reservation fields", () => {
  const updateClause = migrationSql.match(/update public\.reservations as r\s+set([\s\S]*?)where r\.id/)?.[1] ?? "";

  assert.match(updateClause, /service_id =/);
  assert.match(updateClause, /customer_name =/);
  assert.match(updateClause, /customer_phone =/);
  assert.match(updateClause, /date =/);
  assert.match(updateClause, /start_time =/);
  assert.match(updateClause, /end_time =/);
  assert.match(updateClause, /start_at =/);
  assert.match(updateClause, /end_at =/);
  assert.match(updateClause, /duration_min = v_duration_min/);
  assert.match(updateClause, /buffer_min = v_buffer_min/);
  assert.doesNotMatch(updateClause, /organization_id/);
  assert.doesNotMatch(updateClause, /customer_privacy/);
});

test("owner reservation update RPC excludes current reservation from conflict checks", () => {
  assert.match(migrationSql, /r\.id <> p_reservation_id/);
  assert.match(migrationSql, /where s\.id::text = p_service_id/);
  assert.match(migrationSql, /and s\.organization_id = v_organization_id/);
  assert.match(migrationSql, /v_end := \(p_start \+ make_interval\(mins => v_duration_min\)\)::time/);
});
