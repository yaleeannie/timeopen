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

const publicBookingPage = readFileSync(
  new URL("../../app/u/[handle]/page.tsx", import.meta.url),
  "utf8"
);

const withdrawalMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260623200000_add_withdrawal_request_fields.sql",
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

test("public booking handle page is not statically cached across handle changes", () => {
  assert.match(publicBookingPage, /export const dynamic = "force-dynamic"/);
  assert.match(publicBookingPage, /export const revalidate = 0/);
  assert.match(publicBookingPage, /export const fetchCache = "force-no-store"/);
});

test("public services lookup only uses current active organization handles", () => {
  assert.match(withdrawalMigration, /create function public\.get_services_by_handle\(p_handle text\)/);
  assert.match(withdrawalMigration, /where o\.handle = lower\(btrim\(p_handle\)\)/);
  assert.match(withdrawalMigration, /coalesce\(o\.booking_enabled, true\) is true/);
  assert.match(withdrawalMigration, /o\.withdrawal_requested_at is null/);
  assert.match(withdrawalMigration, /o\.disabled_at is null/);
  assert.doesNotMatch(withdrawalMigration, /organization_handle_history/);
});
