import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  new URL(
    "../../supabase/migrations/20260710130000_add_reservation_time_blocks.sql",
    import.meta.url
  ),
  "utf8"
);
const publicLookupMigration = readFileSync(
  new URL(
    "../../supabase/migrations/20260710133000_add_public_time_block_lookup.sql",
    import.meta.url
  ),
  "utf8"
);
const reservationsClientSource = readFileSync(
  new URL("../../app/reservations/ReservationsClient.tsx", import.meta.url),
  "utf8"
);
const reservationsPageSource = readFileSync(
  new URL("../../app/reservations/page.tsx", import.meta.url),
  "utf8"
);
const ownerSlotsRouteSource = readFileSync(
  new URL("../../app/api/reservations/slots/route.ts", import.meta.url),
  "utf8"
);
const createBlockRouteSource = readFileSync(
  new URL("../../app/api/reservations/time-blocks/create/route.ts", import.meta.url),
  "utf8"
);
const deleteBlockRouteSource = readFileSync(
  new URL("../../app/api/reservations/time-blocks/delete/route.ts", import.meta.url),
  "utf8"
);
const fetchAvailabilityRouteSource = readFileSync(
  new URL("../../app/api/fetchAvailability/route.ts", import.meta.url),
  "utf8"
);
const bookingScreenSource = readFileSync(
  new URL("../../features/booking/components/BookingScreen.tsx", import.meta.url),
  "utf8"
);
const tablePolicySection = migration.slice(
  0,
  migration.indexOf("drop function if exists public.create_reservation_time_block")
);

test("time block migration adds additive owner-scoped table and RLS", () => {
  assert.match(migration, /create table if not exists public\.reservation_time_blocks/);
  assert.match(migration, /organization_id uuid not null references public\.organizations/);
  assert.match(migration, /block_date date not null/);
  assert.match(migration, /start_time time not null/);
  assert.match(migration, /end_time time not null/);
  assert.match(migration, /reason text null/);
  assert.match(migration, /created_by uuid null references auth\.users/);
  assert.match(migration, /constraint reservation_time_blocks_time_check check \(start_time < end_time\)/);
  assert.match(migration, /alter table public\.reservation_time_blocks enable row level security/);
  assert.match(tablePolicySection, /for select[\s\S]+to authenticated[\s\S]+organization_members/);
  assert.match(tablePolicySection, /for insert[\s\S]+to authenticated[\s\S]+organization_members/);
  assert.match(tablePolicySection, /for update[\s\S]+to authenticated[\s\S]+organization_members/);
  assert.match(tablePolicySection, /for delete[\s\S]+to authenticated[\s\S]+organization_members/);
  assert.doesNotMatch(tablePolicySection, /to anon/);
});

test("create time block RPC is owner scoped, locked, and rejects overlaps", () => {
  const createRpc = migration.match(
    /create function public\.create_reservation_time_block[\s\S]*?grant execute on function public\.create_reservation_time_block/
  )?.[0] ?? "";

  assert.match(createRpc, /auth\.uid\(\)/);
  assert.match(createRpc, /organization_members/);
  assert.match(createRpc, /role in \('owner', 'member'\)/);
  assert.match(createRpc, /pg_catalog\.pg_advisory_xact_lock/);
  assert.match(createRpc, /hashtextextended\(v_organization_id::text \|\| ':' \|\| p_block_date::text, 0\)/);
  assert.match(createRpc, /coalesce\(r\.status, 'confirmed'\) not in \('cancelled', 'canceled'\)/);
  assert.match(createRpc, /p_start_time < \(r\.end_time::time \+ make_interval\(mins => coalesce\(r\.buffer_min, 0\)\)\)::time/);
  assert.match(createRpc, /r\.start_time::time < p_end_time/);
  assert.match(createRpc, /p_start_time < b\.end_time/);
  assert.match(createRpc, /b\.start_time < p_end_time/);
});

test("delete time block RPC only deletes blocks from the member organization", () => {
  const deleteRpc = migration.match(
    /create function public\.delete_reservation_time_block[\s\S]*?grant execute on function public\.delete_reservation_time_block/
  )?.[0] ?? "";

  assert.match(deleteRpc, /auth\.uid\(\)/);
  assert.match(deleteRpc, /v_block public\.reservation_time_blocks%rowtype/);
  assert.match(deleteRpc, /organization_members/);
  assert.match(deleteRpc, /om\.organization_id = v_block\.organization_id/);
  assert.match(deleteRpc, /om\.user_id = auth\.uid\(\)/);
  assert.match(deleteRpc, /delete from public\.reservation_time_blocks/);
});

test("public busy RPC includes reservation time blocks for public availability", () => {
  const busyRpc = migration.match(
    /create function public\.get_busy_by_handle_date[\s\S]*?grant execute on function public\.get_busy_by_handle_date/
  )?.[0] ?? "";

  assert.match(busyRpc, /from public\.reservations as r/);
  assert.match(busyRpc, /union all/);
  assert.match(busyRpc, /from public\.reservation_time_blocks as b/);
  assert.match(busyRpc, /b\.block_date = p_date/);
  assert.match(
    migration,
    /grant execute on function public\.get_busy_by_handle_date\(text, date\) to anon/
  );
});

test("reservation creation and edit RPCs reject blocked intervals server-side", () => {
  const publicCreateRpc = migration.match(
    /create or replace function public\.create_reservation_by_handle[\s\S]*?grant execute on function public\.create_reservation_by_handle[\s\S]*?to authenticated;/
  )?.[0] ?? "";
  const ownerCreateRpc = migration.match(
    /create or replace function public\.create_owner_reservation[\s\S]*?grant execute on function public\.create_owner_reservation/
  )?.[0] ?? "";
  const updateRpc = migration.match(
    /create or replace function public\.update_owner_reservation[\s\S]*?grant execute on function public\.update_owner_reservation/
  )?.[0] ?? "";

  for (const definition of [publicCreateRpc, ownerCreateRpc, updateRpc]) {
    assert.match(definition, /from public\.reservation_time_blocks as b/);
    assert.match(definition, /b\.block_date = p_date/);
    assert.match(definition, /raise exception 'selected time is blocked'/);
  }
});

test("owner schedule UI can create, display, and delete time blocks", () => {
  assert.match(reservationsClientSource, /function TimeBlockCreator/);
  assert.match(reservationsClientSource, /시간 막기/);
  assert.match(reservationsClientSource, /막는 중\.\.\./);
  assert.match(reservationsClientSource, /사유/);
  assert.match(reservationsClientSource, /예: 개인 일정, 점심시간, 외부 일정/);
  assert.match(reservationsClientSource, /itemType\?: "reservation" \| "block"/);
  assert.match(reservationsClientSource, /reservation\.itemType === "block"/);
  assert.match(reservationsClientSource, /예약 막힘/);
  assert.match(reservationsClientSource, /막기 해제/);
  assert.match(reservationsClientSource, /FloatingReservationToast/);
});

test("time block UI uses configured booking slot interval for start and end choices", () => {
  assert.match(reservationsClientSource, /function buildTimeOptions\(intervalMin: number\)/);
  assert.match(reservationsClientSource, /\[10, 15, 30, 60\]\.includes\(intervalMin\)/);
  assert.match(reservationsClientSource, /minute \+= step/);
  assert.match(reservationsClientSource, /buildTimeOptions\(bookingSlotIntervalMin\)/);
  assert.match(reservationsPageSource, /booking_slot_interval_min/);
  assert.match(reservationsPageSource, /bookingSlotIntervalMin=\{bookingSlotIntervalMin\}/);
});

test("owner slot picker excludes time blocks for manual reservation and edit flows", () => {
  assert.match(ownerSlotsRouteSource, /from\("reservation_time_blocks"\)/);
  assert.match(ownerSlotsRouteSource, /\.eq\("organization_id", organizationId\)/);
  assert.match(ownerSlotsRouteSource, /\.eq\("block_date", dateISO\)/);
  assert.match(ownerSlotsRouteSource, /concat\(/);
  assert.match(ownerSlotsRouteSource, /start: toHHMM\(row\.start_time\)/);
  assert.match(ownerSlotsRouteSource, /end: toHHMM\(row\.end_time\)/);
});

test("time block API routes call authenticated RPCs and return Korean feedback", () => {
  assert.match(createBlockRouteSource, /create_reservation_time_block/);
  assert.match(createBlockRouteSource, /이미 예약이 있는 시간은 막을 수 없어요\./);
  assert.match(createBlockRouteSource, /이미 막혀 있는 시간이에요\./);
  assert.match(createBlockRouteSource, /시간이 막혔어요\./);
  assert.match(deleteBlockRouteSource, /delete_reservation_time_block/);
  assert.match(deleteBlockRouteSource, /막힌 시간이 해제되었어요\./);
});

test("public time block lookup RPC exposes only time ranges by current handle and date", () => {
  assert.match(
    publicLookupMigration,
    /create function public\.get_public_reservation_time_blocks/
  );
  assert.match(publicLookupMigration, /returns table \(\s+start_time time,\s+end_time time\s+\)/s);
  assert.match(publicLookupMigration, /o\.handle = lower\(btrim\(p_handle\)\)/);
  assert.match(publicLookupMigration, /coalesce\(o\.booking_enabled, true\) is true/);
  assert.match(publicLookupMigration, /o\.withdrawal_requested_at is null/);
  assert.match(publicLookupMigration, /o\.disabled_at is null/);
  assert.match(publicLookupMigration, /b\.block_date = p_date/);
  assert.match(publicLookupMigration, /grant execute on function public\.get_public_reservation_time_blocks\(text, date\) to anon/);
  assert.doesNotMatch(publicLookupMigration, /reason/);
  assert.doesNotMatch(publicLookupMigration, /created_by/);
  assert.doesNotMatch(publicLookupMigration, /create policy[\s\S]+to anon/);
});

test("public fetchAvailability loads time blocks through the secure RPC", () => {
  assert.match(fetchAvailabilityRouteSource, /get_public_reservation_time_blocks/);
  assert.match(fetchAvailabilityRouteSource, /p_handle: handle/);
  assert.match(fetchAvailabilityRouteSource, /p_date: requestedDate/);
  assert.match(fetchAvailabilityRouteSource, /time_blocks: timeBlocks/);
  assert.match(fetchAvailabilityRouteSource, /loadedBlockCount: timeBlocks\.length/);
  assert.doesNotMatch(fetchAvailabilityRouteSource, /\.from\("reservation_time_blocks"\)/);
});

test("public booking slot calculation merges public time blocks into busy ranges", () => {
  assert.match(bookingScreenSource, /normalizeTimeRanges/);
  assert.match(bookingScreenSource, /body: JSON\.stringify\(\{ handle, date: nextDateISO \}\)/);
  assert.match(bookingScreenSource, /availabilityRes\?\.time_blocks/);
  assert.match(bookingScreenSource, /const busy = \[\.\.\.\(busyRes\?\.busy \?\? \[\]\), \.\.\.publicTimeBlocks\]/);
  assert.match(bookingScreenSource, /loadedBlockCount: publicTimeBlocks\.length/);
});
