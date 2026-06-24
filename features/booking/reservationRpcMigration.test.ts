import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260624140000_include_duration_in_reservation_rpc.sql",
    import.meta.url
  ),
  "utf8"
);

test("hotfix migration restores the 9-argument reservation RPC before the consent wrapper", () => {
  const nineArgDefinition = migrationSql.indexOf(
    `create or replace function public.create_reservation_by_handle(
  p_handle text,
  p_service_id text,
  p_date date,
  p_start time,
  p_end time,
  p_duration_min integer,
  p_buffer_min integer,
  p_customer_name text,
  p_customer_phone text
)`
  );

  const twelveArgDefinition = migrationSql.indexOf(
    `create or replace function public.create_reservation_by_handle(
  p_handle text,
  p_service_id text,
  p_date date,
  p_start time,
  p_end time,
  p_duration_min integer,
  p_buffer_min integer,
  p_customer_name text,
  p_customer_phone text,
  p_customer_privacy_agreed boolean`
  );

  assert.ok(nineArgDefinition >= 0, "9-argument RPC definition must exist");
  assert.ok(twelveArgDefinition >= 0, "12-argument consent wrapper must exist");
  assert.ok(
    nineArgDefinition < twelveArgDefinition,
    "9-argument RPC must be created before the wrapper calls it"
  );
});

test("restored reservation RPC inserts required reservation duration", () => {
  assert.match(
    migrationSql,
    /insert into public\.reservations \(\s*organization_id,\s*service_id,\s*date,\s*start_time,\s*end_time,\s*start_at,\s*end_at,\s*duration_min,\s*status,\s*customer_name,\s*customer_phone\s*\)/s
  );
  assert.match(
    migrationSql,
    /\(\(p_date \+ p_end\) at time zone 'Asia\/Seoul'\),\s*p_duration_min,\s*'confirmed'/s
  );
});

test("consent wrapper persists customer privacy consent after reservation creation", () => {
  assert.match(
    migrationSql,
    /select public\.create_reservation_by_handle\(\s*p_handle,\s*p_service_id,\s*p_date,\s*p_start,\s*p_end,\s*p_duration_min,\s*p_buffer_min,\s*p_customer_name,\s*p_customer_phone\s*\)\s*into v_reservation_id;/s
  );
  assert.match(migrationSql, /customer_privacy_agreed_at = p_customer_privacy_agreed_at/);
  assert.match(
    migrationSql,
    /customer_privacy_policy_version = p_customer_privacy_policy_version/
  );
});
