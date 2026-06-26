alter table public.organizations
  add column if not exists booking_confirmation_mode text not null default 'automatic',
  add column if not exists booking_notice text null;

alter table public.organizations
  alter column booking_confirmation_mode set default 'automatic';

alter table public.organizations
  drop constraint if exists organizations_booking_confirmation_mode_check;

alter table public.organizations
  add constraint organizations_booking_confirmation_mode_check
  check (booking_confirmation_mode in ('manual', 'automatic'));

comment on column public.organizations.booking_confirmation_mode is
  'automatic creates public bookings as confirmed; manual creates public bookings as requested for owner deposit/schedule confirmation.';

comment on column public.organizations.booking_notice is
  'Shop-provided booking notice shown to customers before submit and after reservation completion.';

create or replace function public.create_reservation_by_handle(
  p_handle text,
  p_service_id text,
  p_date date,
  p_start time,
  p_end time,
  p_duration_min integer,
  p_buffer_min integer,
  p_customer_name text,
  p_customer_phone text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_booking_confirmation_mode text;
  v_status text;
  v_service_id uuid;
  v_service_duration_min integer;
  v_service_cleanup_min integer;
  v_reservation_id uuid;
begin
  select
    o.id,
    coalesce(o.booking_confirmation_mode, 'automatic')
  into
    v_organization_id,
    v_booking_confirmation_mode
  from public.organizations as o
  where o.handle = lower(btrim(p_handle))
    and coalesce(o.booking_enabled, true) is true
    and o.withdrawal_requested_at is null
    and o.disabled_at is null
  order by o.id asc
  limit 1;

  if v_organization_id is null then
    raise exception 'organization not found or booking disabled';
  end if;

  v_status := case
    when v_booking_confirmation_mode = 'automatic' then 'confirmed'
    else 'requested'
  end;

  select
    s.id,
    s.duration_min::integer,
    coalesce(s.cleanup_min, 0)::integer
  into
    v_service_id,
    v_service_duration_min,
    v_service_cleanup_min
  from public.services as s
  where s.id::text = p_service_id
    and s.organization_id = v_organization_id
    and s.active is true
  limit 1;

  if v_service_id is null then
    raise exception 'service not found';
  end if;

  if p_date is null or p_start is null or p_end is null then
    raise exception 'reservation date and time are required';
  end if;

  if p_end <= p_start then
    raise exception 'reservation end time must be after start time';
  end if;

  if p_duration_min is null or p_duration_min <= 0 then
    raise exception 'duration must be positive';
  end if;

  if p_buffer_min is null or p_buffer_min < 0 then
    raise exception 'buffer must be zero or positive';
  end if;

  if p_duration_min <> v_service_duration_min then
    raise exception 'service duration mismatch';
  end if;

  if btrim(coalesce(p_customer_name, '')) = '' then
    raise exception 'customer name is required';
  end if;

  if btrim(coalesce(p_customer_phone, '')) = '' then
    raise exception 'customer phone is required';
  end if;

  if exists (
    select 1
    from public.reservations as r
    left join public.services as existing_service
      on existing_service.id::text = r.service_id
     and existing_service.organization_id = r.organization_id
    where r.organization_id = v_organization_id
      and r.date = p_date
      and coalesce(r.status, 'confirmed') not in ('cancelled', 'canceled')
      and r.start_time is not null
      and r.end_time is not null
      and p_start < (r.end_time::time + make_interval(mins => coalesce(existing_service.cleanup_min, 0)))::time
      and r.start_time::time < (p_end::time + make_interval(mins => p_buffer_min))::time
  ) then
    raise exception 'selected time is no longer available';
  end if;

  insert into public.reservations (
    organization_id,
    service_id,
    date,
    start_time,
    end_time,
    start_at,
    end_at,
    duration_min,
    buffer_min,
    status,
    customer_name,
    customer_phone
  )
  values (
    v_organization_id,
    v_service_id::text,
    p_date,
    p_start,
    p_end,
    ((p_date + p_start) at time zone 'Asia/Seoul'),
    ((p_date + p_end) at time zone 'Asia/Seoul'),
    p_duration_min,
    p_buffer_min,
    v_status,
    btrim(p_customer_name),
    btrim(p_customer_phone)
  )
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

revoke all on function public.create_reservation_by_handle(
  text,
  text,
  date,
  time,
  time,
  integer,
  integer,
  text,
  text
) from public;
grant execute on function public.create_reservation_by_handle(
  text,
  text,
  date,
  time,
  time,
  integer,
  integer,
  text,
  text
) to anon;
grant execute on function public.create_reservation_by_handle(
  text,
  text,
  date,
  time,
  time,
  integer,
  integer,
  text,
  text
) to authenticated;

create or replace function public.create_reservation_by_handle(
  p_handle text,
  p_service_id text,
  p_date date,
  p_start time,
  p_end time,
  p_duration_min integer,
  p_buffer_min integer,
  p_customer_name text,
  p_customer_phone text,
  p_customer_privacy_agreed boolean,
  p_customer_privacy_agreed_at timestamptz,
  p_customer_privacy_policy_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation_id uuid;
begin
  if coalesce(p_customer_privacy_agreed, false) is not true then
    raise exception 'customer privacy consent required';
  end if;

  if p_customer_privacy_agreed_at is null then
    raise exception 'customer privacy agreed timestamp required';
  end if;

  if nullif(btrim(coalesce(p_customer_privacy_policy_version, '')), '') is null then
    raise exception 'customer privacy policy version required';
  end if;

  select public.create_reservation_by_handle(
    p_handle,
    p_service_id,
    p_date,
    p_start,
    p_end,
    p_duration_min,
    p_buffer_min,
    p_customer_name,
    p_customer_phone
  )
  into v_reservation_id;

  update public.reservations
  set
    customer_privacy_agreed_at = p_customer_privacy_agreed_at,
    customer_privacy_policy_version = p_customer_privacy_policy_version
  where id = v_reservation_id;

  return v_reservation_id;
end;
$$;

revoke all on function public.create_reservation_by_handle(
  text,
  text,
  date,
  time,
  time,
  integer,
  integer,
  text,
  text,
  boolean,
  timestamptz,
  text
) from public;
grant execute on function public.create_reservation_by_handle(
  text,
  text,
  date,
  time,
  time,
  integer,
  integer,
  text,
  text,
  boolean,
  timestamptz,
  text
) to anon;
grant execute on function public.create_reservation_by_handle(
  text,
  text,
  date,
  time,
  time,
  integer,
  integer,
  text,
  text,
  boolean,
  timestamptz,
  text
) to authenticated;

drop function if exists public.get_public_reservation_confirmation(text, uuid);

create function public.get_public_reservation_confirmation(
  p_handle text,
  p_reservation_id uuid
)
returns table (
  reservation_date date,
  start_time time,
  end_time time,
  reservation_status text,
  organization_name text,
  service_name text,
  service_name_translations jsonb,
  customer_name text,
  customer_phone text,
  location_text text,
  notice_text text,
  booking_contact text,
  booking_notice text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.date::date,
    r.start_time::time,
    r.end_time::time,
    coalesce(r.status, 'confirmed')::text,
    coalesce(o.name, o.handle, '')::text,
    coalesce(s.name, '')::text,
    coalesce(s.name_translations, '{}'::jsonb),
    coalesce(r.customer_name, '')::text,
    coalesce(r.customer_phone, '')::text,
    coalesce(o.location_text, '')::text,
    coalesce(o.notice_text, '')::text,
    coalesce(o.booking_contact, '')::text,
    coalesce(o.booking_notice, '')::text
  from public.reservations as r
  join public.organizations as o
    on o.id = r.organization_id
  left join public.services as s
    on s.id::text = r.service_id
   and s.organization_id = r.organization_id
  where r.id = p_reservation_id
    and o.handle = lower(btrim(p_handle))
  limit 1;
$$;

revoke all on function public.get_public_reservation_confirmation(text, uuid) from public;
grant execute on function public.get_public_reservation_confirmation(text, uuid) to anon;
grant execute on function public.get_public_reservation_confirmation(text, uuid) to authenticated;

create or replace function public.confirm_owner_reservation(p_reservation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_current_status text;
begin
  if v_user_id is null then
    raise exception '로그인이 필요합니다.';
  end if;

  select r.organization_id, coalesce(r.status, 'confirmed')
    into v_organization_id, v_current_status
  from public.reservations as r
  where r.id = p_reservation_id
  for update;

  if v_organization_id is null then
    raise exception '예약을 찾지 못했어요.';
  end if;

  if not exists (
    select 1
    from public.organization_members as m
    where m.organization_id = v_organization_id
      and m.user_id = v_user_id
      and m.role in ('owner', 'member')
  ) then
    raise exception '권한이 없습니다.';
  end if;

  if v_current_status <> 'requested' then
    raise exception '예약 요청 상태만 확정할 수 있어요.';
  end if;

  update public.reservations as r
  set status = 'confirmed'
  where r.id = p_reservation_id;

  return p_reservation_id;
end;
$$;

revoke all on function public.confirm_owner_reservation(uuid) from public;
grant execute on function public.confirm_owner_reservation(uuid) to authenticated;
