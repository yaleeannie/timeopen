create table if not exists public.organization_holidays (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  date date not null,
  type text not null default 'closed' check (type = 'closed'),
  note text null,
  created_at timestamptz not null default now(),
  unique (organization_id, date)
);

create index if not exists organization_holidays_organization_date_idx
  on public.organization_holidays (organization_id, date);

alter table public.organization_holidays enable row level security;

revoke all on table public.organization_holidays from anon;
grant select, insert, update, delete on table public.organization_holidays to authenticated;

drop policy if exists "owners can manage organization holidays"
  on public.organization_holidays;

create policy "owners can manage organization holidays"
on public.organization_holidays
for all
to authenticated
using (
  exists (
    select 1
    from public.organization_members as om
    where om.organization_id = organization_holidays.organization_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.organization_members as om
    where om.organization_id = organization_holidays.organization_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
  )
);

create or replace function public.get_holiday_by_handle_date(
  p_handle text,
  p_date date
)
returns table (
  is_closed boolean,
  note text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    true,
    h.note
  from public.organization_holidays as h
  join public.organizations as o
    on o.id = h.organization_id
  where o.handle = lower(btrim(p_handle))
    and h.date = p_date
    and h.type = 'closed'
  limit 1;
$$;

revoke all on function public.get_holiday_by_handle_date(text, date) from public;
grant execute on function public.get_holiday_by_handle_date(text, date) to anon;
grant execute on function public.get_holiday_by_handle_date(text, date) to authenticated;
