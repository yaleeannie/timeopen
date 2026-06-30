create extension if not exists pgcrypto with schema extensions;

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
  v_public_manage_token text;
  v_token_attempt integer := 0;
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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_organization_id::text || ':' || p_date::text, 0)
  );

  if exists (
    select 1
    from public.reservations as r
    where r.organization_id = v_organization_id
      and r.date = p_date
      and coalesce(r.status, 'confirmed') not in ('cancelled', 'canceled')
      and r.start_time is not null
      and r.end_time is not null
      and p_start < (r.end_time::time + make_interval(mins => coalesce(r.buffer_min, 0)))::time
      and r.start_time::time < (p_end::time + make_interval(mins => p_buffer_min))::time
  ) then
    raise exception 'selected time is no longer available';
  end if;

  loop
    v_token_attempt := v_token_attempt + 1;
    v_public_manage_token := translate(
      rtrim(encode(extensions.gen_random_bytes(16), 'base64'), '='),
      '+/',
      '-_'
    );

    exit when not exists (
      select 1
      from public.reservations as r
      where r.public_manage_token = v_public_manage_token
    );

    if v_token_attempt >= 5 then
      raise exception 'could not generate unique reservation management token';
    end if;
  end loop;

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
    customer_phone,
    public_manage_token,
    public_manage_token_created_at
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
    btrim(p_customer_phone),
    v_public_manage_token,
    now()
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
