create table if not exists public.organization_handle_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  handle text not null,
  released_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists organization_handle_history_lower_handle_key
  on public.organization_handle_history (lower(handle));

create unique index if not exists organizations_lower_handle_key
  on public.organizations (lower(handle))
  where handle is not null and btrim(handle) <> '';

alter table public.organizations
  add column if not exists handle_changed_at timestamptz null;

alter table public.organization_handle_history enable row level security;

drop policy if exists "organization_handle_history_no_public_access" on public.organization_handle_history;

comment on table public.organization_handle_history is
  'Stores previous public booking handles so old links remain unavailable and cannot be claimed by other shops.';

comment on column public.organizations.handle_changed_at is
  'Last successful booking handle change time. Used to limit handle changes to once every 14 days.';

create or replace function public.is_reserved_booking_handle(p_handle text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select lower(btrim(p_handle)) = any(array[
    'admin',
    'api',
    'auth',
    'login',
    'signup',
    'owner',
    'onboarding',
    'settings',
    'reservations',
    'u',
    'beta',
    'support',
    'contact',
    'help',
    'terms',
    'privacy',
    'timeopen'
  ]);
$$;

create or replace function public.check_organization_handle_availability(
  p_organization_id uuid,
  p_handle text
)
returns table (
  valid boolean,
  available boolean,
  current boolean,
  own_history boolean,
  reason text,
  cooldown_until timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_handle text := lower(btrim(coalesce(p_handle, '')));
  v_current_handle text;
  v_handle_changed_at timestamptz;
  v_other_current uuid;
  v_history_owner uuid;
  v_cooldown_until timestamptz;
begin
  if v_user_id is null then
    return query select false, false, false, false, '로그인이 필요합니다.', null::timestamptz;
    return;
  end if;

  if not exists (
    select 1
    from public.organization_members as m
    where m.organization_id = p_organization_id
      and m.user_id = v_user_id
      and m.role in ('owner', 'member')
  ) then
    return query select false, false, false, false, '권한이 없습니다.', null::timestamptz;
    return;
  end if;

  if v_handle !~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$' then
    return query select false, false, false, false, '영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있어요.', null::timestamptz;
    return;
  end if;

  if public.is_reserved_booking_handle(v_handle) then
    return query select false, false, false, false, '사용할 수 없는 예약 링크예요.', null::timestamptz;
    return;
  end if;

  select o.handle, o.handle_changed_at
    into v_current_handle, v_handle_changed_at
  from public.organizations as o
  where o.id = p_organization_id;

  if lower(coalesce(v_current_handle, '')) = v_handle then
    return query select true, true, true, false, null::text, null::timestamptz;
    return;
  end if;

  if v_handle_changed_at is not null then
    v_cooldown_until := v_handle_changed_at + interval '14 days';
    if v_cooldown_until > now() then
      return query select true, false, false, false, '예약 링크는 14일에 한 번만 변경할 수 있어요.', v_cooldown_until;
      return;
    end if;
  end if;

  select o.id
    into v_other_current
  from public.organizations as o
  where lower(o.handle) = v_handle
    and o.id <> p_organization_id
  limit 1;

  if v_other_current is not null then
    return query select true, false, false, false, '이미 사용 중이거나 더 이상 사용할 수 없는 링크예요.', null::timestamptz;
    return;
  end if;

  select h.organization_id
    into v_history_owner
  from public.organization_handle_history as h
  where lower(h.handle) = v_handle
  limit 1;

  if v_history_owner is not null and v_history_owner <> p_organization_id then
    return query select true, false, false, false, '이미 사용 중이거나 더 이상 사용할 수 없는 링크예요.', null::timestamptz;
    return;
  end if;

  return query select true, true, false, v_history_owner = p_organization_id, null::text, null::timestamptz;
end;
$$;

create or replace function public.change_organization_handle(p_handle text)
returns table (
  organization_id uuid,
  handle text,
  handle_changed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_current_handle text;
  v_handle_changed_at timestamptz;
  v_handle text := lower(btrim(coalesce(p_handle, '')));
  v_cooldown_until timestamptz;
  v_other_current uuid;
  v_history_owner uuid;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select m.organization_id
    into v_organization_id
  from public.organization_members as m
  where m.user_id = v_user_id
    and m.role = 'owner'
  limit 1;

  if v_organization_id is null then
    raise exception '권한이 없습니다.';
  end if;

  if v_handle !~ '^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$' then
    raise exception '영문 소문자, 숫자, 하이픈(-), 언더스코어(_)만 사용할 수 있어요.';
  end if;

  if public.is_reserved_booking_handle(v_handle) then
    raise exception '사용할 수 없는 예약 링크예요.';
  end if;

  select o.handle, o.handle_changed_at
    into v_current_handle, v_handle_changed_at
  from public.organizations as o
  where o.id = v_organization_id
  for update;

  if lower(coalesce(v_current_handle, '')) = v_handle then
    return query
      select v_organization_id, v_handle, v_handle_changed_at;
    return;
  end if;

  if v_current_handle is not null and btrim(v_current_handle) <> '' and v_handle_changed_at is not null then
    v_cooldown_until := v_handle_changed_at + interval '14 days';
    if v_cooldown_until > now() then
      raise exception '예약 링크는 14일에 한 번만 변경할 수 있어요.';
    end if;
  end if;

  select o.id
    into v_other_current
  from public.organizations as o
  where lower(o.handle) = v_handle
    and o.id <> v_organization_id
  limit 1;

  if v_other_current is not null then
    raise exception '이미 사용 중이거나 더 이상 사용할 수 없는 링크예요.';
  end if;

  select h.organization_id
    into v_history_owner
  from public.organization_handle_history as h
  where lower(h.handle) = v_handle
  limit 1;

  if v_history_owner is not null and v_history_owner <> v_organization_id then
    raise exception '이미 사용 중이거나 더 이상 사용할 수 없는 링크예요.';
  end if;

  if v_current_handle is not null and btrim(v_current_handle) <> '' then
    insert into public.organization_handle_history (organization_id, handle)
    values (v_organization_id, lower(btrim(v_current_handle)))
    on conflict do nothing;
  end if;

  update public.organizations as o
  set handle = v_handle,
      handle_changed_at = now()
  where o.id = v_organization_id
  returning o.id, o.handle, o.handle_changed_at
    into v_organization_id, v_handle, v_handle_changed_at;

  return query select v_organization_id, v_handle, v_handle_changed_at;
end;
$$;

revoke all on function public.is_reserved_booking_handle(text) from public;
grant execute on function public.is_reserved_booking_handle(text) to authenticated;

revoke all on function public.check_organization_handle_availability(uuid, text) from public;
grant execute on function public.check_organization_handle_availability(uuid, text) to authenticated;

revoke all on function public.change_organization_handle(text) from public;
grant execute on function public.change_organization_handle(text) to authenticated;
