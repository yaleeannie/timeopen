import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const profileRoute = readFileSync(
  new URL("../../app/api/settings/profile/route.ts", import.meta.url),
  "utf8"
);

const updateProfileRoute = readFileSync(
  new URL("../../app/api/owner/update-profile/route.ts", import.meta.url),
  "utf8"
);

const publicLookupMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260627100000_add_public_current_organization_lookup.sql",
    import.meta.url
  ),
  "utf8"
);

test("shop name/profile saves do not invoke booking handle change logic", () => {
  assert.doesNotMatch(profileRoute, /change_organization_handle/);
  assert.doesNotMatch(updateProfileRoute, /change_organization_handle/);
  assert.doesNotMatch(profileRoute, /organization_handle_history/);
  assert.doesNotMatch(updateProfileRoute, /organization_handle_history/);
});

test("shop name update payload does not mutate handle fields", () => {
  assert.match(profileRoute, /const updates: \{/);
  assert.match(profileRoute, /name: string/);
  assert.doesNotMatch(profileRoute, /handle_changed_at/);
  assert.doesNotMatch(profileRoute, /\.update\(\{[^}]*handle/s);
});

test("public booking lookup resolves only current organization handles", () => {
  assert.match(
    publicLookupMigration,
    /create function public\.get_public_organization_by_handle\(p_handle text\)/
  );
  assert.match(publicLookupMigration, /where lower\(o\.handle\) = lower\(btrim\(p_handle\)\)/);
  assert.doesNotMatch(publicLookupMigration, /organization_handle_history/);
  assert.match(publicLookupMigration, /Historical handles are intentionally not resolved/);
});
