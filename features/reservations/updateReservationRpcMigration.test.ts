import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260624170000_add_owner_reservation_update_rpc.sql",
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

  assert.match(updateClause, /customer_name =/);
  assert.match(updateClause, /customer_phone =/);
  assert.match(updateClause, /date =/);
  assert.match(updateClause, /start_time =/);
  assert.match(updateClause, /end_time =/);
  assert.match(updateClause, /start_at =/);
  assert.match(updateClause, /end_at =/);
  assert.doesNotMatch(updateClause, /organization_id/);
  assert.doesNotMatch(updateClause, /service_id/);
  assert.doesNotMatch(updateClause, /duration_min/);
  assert.doesNotMatch(updateClause, /buffer_min/);
  assert.doesNotMatch(updateClause, /customer_privacy/);
});
