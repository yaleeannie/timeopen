alter table public.services
  add column if not exists name_translations jsonb not null default '{}'::jsonb;

drop function if exists public.get_services_by_handle(text);

create function public.get_services_by_handle(p_handle text)
returns table (
  id uuid,
  organization_id uuid,
  name text,
  name_translations jsonb,
  duration_min integer,
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
    s.duration_min::integer,
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
