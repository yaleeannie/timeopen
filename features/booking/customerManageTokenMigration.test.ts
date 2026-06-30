import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260630120000_add_public_reservation_manage_token.sql",
    import.meta.url
  ),
  "utf8"
);

const pgcryptoHotfixSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260630130000_enable_pgcrypto_for_reservation_manage_tokens.sql",
    import.meta.url
  ),
  "utf8"
);

test("customer management token migration adds secure token columns", () => {
  assert.match(migrationSql, /public_manage_token text null/);
  assert.match(migrationSql, /public_manage_token_created_at timestamptz null/);
  assert.match(migrationSql, /reservations_public_manage_token_key/);
  assert.match(migrationSql, /where public_manage_token is not null/);
});

test("new reservations receive an opaque non-id public management token", () => {
  assert.match(migrationSql, /public_manage_token,\s*public_manage_token_created_at/s);
  assert.match(pgcryptoHotfixSql, /create extension if not exists pgcrypto with schema extensions/);
  assert.match(pgcryptoHotfixSql, /encode\(extensions\.gen_random_bytes\(32\), 'hex'\)/);
  assert.doesNotMatch(migrationSql, /public_manage_token,\s*id/s);
});

test("public confirmation RPC returns the management token for completion and SMS links", () => {
  assert.match(migrationSql, /public_manage_token text/);
  assert.match(migrationSql, /coalesce\(r\.public_manage_token, ''\)::text/);
});

test("public cancellation RPC enforces the three-day cutoff server-side", () => {
  assert.match(migrationSql, /cancel_public_reservation_by_manage_token/);
  assert.match(migrationSql, /now\(\) > \(v_start_at - interval '3 days'\)/);
  assert.match(migrationSql, /set\s+status = 'cancelled'/s);
  assert.match(migrationSql, /where r\.public_manage_token = nullif\(btrim\(p_token\), ''\)/);
});
