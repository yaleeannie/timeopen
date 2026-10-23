-- This migration adds an opt-in write guard only. It does not alter existing
-- reservation/store rows, RLS policies, or RPC EXECUTE grants.

create schema if not exists timeopen_private;

revoke all on schema timeopen_private from public, anon, authenticated, service_role;

create table if not exists timeopen_private.service_control (
  singleton boolean primary key default true check (singleton is true),
  maintenance_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table timeopen_private.service_control enable row level security;
revoke all on table timeopen_private.service_control
  from public, anon, authenticated, service_role;

insert into timeopen_private.service_control (singleton, maintenance_mode)
values (true, false)
on conflict (singleton) do nothing;

create or replace function timeopen_private.reject_new_rows_during_maintenance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_maintenance_mode boolean;
begin
  -- Shared lock permits concurrent inserts, while the operator's exclusive
  -- lock makes turning maintenance on wait for in-flight inserts to finish.
  perform pg_catalog.pg_advisory_xact_lock_shared(
    pg_catalog.hashtextextended('timeopen:maintenance-state', 0)
  );

  select control.maintenance_mode
    into v_maintenance_mode
  from timeopen_private.service_control as control
  where control.singleton is true;

  if not found then
    raise exception 'TimeOpen maintenance configuration is missing'
      using errcode = 'P0001';
  end if;

  if v_maintenance_mode then
    raise exception 'TIMEOPEN_MAINTENANCE_MODE: new records are paused'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function timeopen_private.reject_new_rows_during_maintenance()
  from public, anon, authenticated, service_role;

drop trigger if exists timeopen_maintenance_guard_reservation_insert
  on public.reservations;
create trigger timeopen_maintenance_guard_reservation_insert
before insert on public.reservations
for each row execute function timeopen_private.reject_new_rows_during_maintenance();

drop trigger if exists timeopen_maintenance_guard_organization_insert
  on public.organizations;
create trigger timeopen_maintenance_guard_organization_insert
before insert on public.organizations
for each row execute function timeopen_private.reject_new_rows_during_maintenance();
