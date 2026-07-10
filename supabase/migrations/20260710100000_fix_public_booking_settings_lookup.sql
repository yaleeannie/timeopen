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
  booking_contact text,
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
    o.booking_contact,
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
  'Returns the current public booking organization settings for the given active handle. Historical handles are intentionally not resolved.';

revoke all on function public.get_public_organization_by_handle(text) from public;
grant execute on function public.get_public_organization_by_handle(text) to anon;
grant execute on function public.get_public_organization_by_handle(text) to authenticated;
