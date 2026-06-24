import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260624160000_add_legal_notice_tracking.sql",
    import.meta.url
  ),
  "utf8"
);

test("legal notice migration creates locked-down tracking tables", () => {
  assert.match(migrationSql, /create table if not exists public\.legal_notices/s);
  assert.match(
    migrationSql,
    /type text not null check \(type in \('terms', 'privacy'\)\)/
  );
  assert.match(migrationSql, /create table if not exists public\.legal_notice_recipients/s);
  assert.match(
    migrationSql,
    /status text not null default 'pending' check \(status in \('pending', 'sent', 'failed'\)\)/
  );
  assert.match(
    migrationSql,
    /alter table public\.legal_notices enable row level security;/
  );
  assert.match(
    migrationSql,
    /alter table public\.legal_notice_recipients enable row level security;/
  );
  assert.doesNotMatch(migrationSql, /create policy/i);
});

test("legal notice migration adds delivery tracking indexes and no email sending", () => {
  assert.match(migrationSql, /legal_notices_type_version_idx/);
  assert.match(migrationSql, /legal_notice_recipients_notice_id_idx/);
  assert.match(migrationSql, /legal_notice_recipients_user_id_idx/);
  assert.match(migrationSql, /legal_notice_recipients_status_idx/);
  assert.match(migrationSql, /TODO: implement legal notice email sender with Resend/);
  assert.doesNotMatch(migrationSql, /resend\.emails\.send/i);
});
