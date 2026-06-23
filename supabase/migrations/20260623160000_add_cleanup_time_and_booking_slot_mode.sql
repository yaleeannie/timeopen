alter table public.services
  add column if not exists cleanup_min integer not null default 0;

alter table public.services
  drop constraint if exists services_cleanup_min_check;

alter table public.services
  add constraint services_cleanup_min_check
  check (cleanup_min >= 0 and cleanup_min <= 120);

alter table public.organizations
  add column if not exists booking_slot_mode text not null default 'flexible';

alter table public.organizations
  drop constraint if exists organizations_booking_slot_mode_check;

alter table public.organizations
  add constraint organizations_booking_slot_mode_check
  check (booking_slot_mode in ('flexible', 'service_duration'));

drop function if exists public.get_services_by_handle(text);

create function public.get_services_by_handle(p_handle text)
returns table (
  id uuid,
  organization_id uuid,
  name text,
  name_translations jsonb,
  description text,
  duration_min integer,
  cleanup_min integer,
  price numeric,
  active boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.organization_id,
    s.name::text,
    coalesce(s.name_translations, '{}'::jsonb),
    s.description::text,
    s.duration_min::integer,
    coalesce(s.cleanup_min, 0)::integer,
    s.price::numeric,
    s.active
  from public.services as s
  where s.organization_id = (
    select o.id
    from public.organizations as o
    where o.handle = lower(btrim(p_handle))
    order by o.id asc
    limit 1
  )
    and s.active is true
  order by s.created_at asc, s.id asc;
$$;

revoke all on function public.get_services_by_handle(text) from public;
grant execute on function public.get_services_by_handle(text) to anon;
grant execute on function public.get_services_by_handle(text) to authenticated;

drop function if exists public.get_busy_by_handle_date(text, date);

create function public.get_busy_by_handle_date(
  p_handle text,
  p_date date
)
returns table (
  start_time time,
  end_time time
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.start_time::time,
    (r.end_time::time + make_interval(mins => coalesce(s.cleanup_min, 0)))::time
  from public.reservations as r
  join public.organizations as o
    on o.id = r.organization_id
  left join public.services as s
    on s.id::text = r.service_id
   and s.organization_id = r.organization_id
  where o.handle = lower(btrim(p_handle))
    and r.date = p_date
    and coalesce(r.status, 'confirmed') not in ('cancelled', 'canceled')
    and r.start_time is not null
    and r.end_time is not null
  order by r.start_time asc;
$$;

revoke all on function public.get_busy_by_handle_date(text, date) from public;
grant execute on function public.get_busy_by_handle_date(text, date) to anon;
grant execute on function public.get_busy_by_handle_date(text, date) to authenticated;
