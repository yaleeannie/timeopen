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

const schemaQualifiedTokenHotfixSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260630140000_schema_qualify_reservation_token_generator.sql",
    import.meta.url
  ),
  "utf8"
);

const shortTokenMigrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260630170000_shorten_public_manage_tokens.sql",
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
  assert.match(schemaQualifiedTokenHotfixSql, /create extension if not exists pgcrypto with schema extensions/);
  assert.match(shortTokenMigrationSql, /extensions\.gen_random_bytes\(16\)/);
  assert.match(shortTokenMigrationSql, /encode\(extensions\.gen_random_bytes\(16\), 'base64'\)/);
  assert.match(shortTokenMigrationSql, /translate\(/);
  assert.match(shortTokenMigrationSql, /rtrim\(/);
  assert.doesNotMatch(shortTokenMigrationSql, /gen_random_bytes\(32\)/);
  assert.doesNotMatch(shortTokenMigrationSql, /encode\(extensions\.gen_random_bytes\(32\), 'hex'\)/);
  assert.doesNotMatch(migrationSql, /public_manage_token,\s*id/s);
});

test("short management token generation retries collisions before insert", () => {
  assert.match(shortTokenMigrationSql, /loop/);
  assert.match(shortTokenMigrationSql, /v_token_attempt := v_token_attempt \+ 1/);
  assert.match(shortTokenMigrationSql, /where r\.public_manage_token = v_public_manage_token/);
  assert.match(shortTokenMigrationSql, /if v_token_attempt >= 5 then/);
  assert.match(shortTokenMigrationSql, /v_public_manage_token,/);
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

test("public token lookup does not impose a short-token-only length restriction", () => {
  assert.match(migrationSql, /where r\.public_manage_token = nullif\(btrim\(p_token\), ''\)/);
  assert.doesNotMatch(migrationSql, /length\(.*public_manage_token/);
  assert.doesNotMatch(migrationSql, /char_length\(.*public_manage_token/);
});
