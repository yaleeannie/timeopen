import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationSql = readFileSync(
  new URL(
    "../../supabase/migrations/20260627110000_allow_requested_reservation_status.sql",
    import.meta.url
  ),
  "utf8"
);

test("reservation status constraint allows requested reservations", () => {
  assert.match(
    migrationSql,
    /drop constraint if exists reservations_status_check/
  );
  assert.match(
    migrationSql,
    /add constraint reservations_status_check\s+check \(status in \('requested', 'confirmed', 'cancelled', 'canceled'\)\)/
  );
});
