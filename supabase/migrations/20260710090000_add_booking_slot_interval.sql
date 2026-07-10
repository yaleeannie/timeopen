alter table public.organizations
  add column if not exists booking_slot_interval_min integer not null default 10;

update public.organizations
set booking_slot_interval_min = 10
where booking_slot_interval_min is null
  or booking_slot_interval_min not in (10, 15, 30, 60);

alter table public.organizations
  alter column booking_slot_interval_min set default 10,
  alter column booking_slot_interval_min set not null;

alter table public.organizations
  drop constraint if exists organizations_booking_slot_interval_min_check;

alter table public.organizations
  add constraint organizations_booking_slot_interval_min_check
  check (booking_slot_interval_min in (10, 15, 30, 60));

drop function if exists public.get_public_organization_by_handle(text);

create function public.get_public_organization_by_handle(p_handle text)
returns table (
  id uuid,
  handle text,
  name text,
  display_name text,
  created_at timestamptz,
  location_text text,
  notice_text text,
  booking_notice text,
  link_theme text,
  booking_slot_mode text,
  booking_slot_interval_min integer,
  booking_enabled boolean,
  withdrawal_requested_at timestamptz,
  disabled_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.id,
    o.handle,
    o.name,
    o.display_name,
    o.created_at,
    o.location_text,
    o.notice_text,
    o.booking_notice,
    o.link_theme,
    o.booking_slot_mode,
    o.booking_slot_interval_min,
    o.booking_enabled,
    o.withdrawal_requested_at,
    o.disabled_at
  from public.organizations as o
  where lower(o.handle) = lower(btrim(p_handle))
  order by o.id asc
  limit 1;
$$;

comment on function public.get_public_organization_by_handle(text) is
  'Returns only the organization currently using the given public booking handle. Historical handles are intentionally not resolved.';

revoke all on function public.get_public_organization_by_handle(text) from public;
grant execute on function public.get_public_organization_by_handle(text) to anon;
grant execute on function public.get_public_organization_by_handle(text) to authenticated;
