create extension if not exists pgcrypto with schema extensions;

drop function if exists public.create_owner_reservation(text, date, time, text, text);

create function public.create_owner_reservation(
  p_service_id text,
  p_date date,
  p_start time,
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
  v_service_id uuid;
  v_duration_min integer;
  v_buffer_min integer;
  v_end time;
  v_reservation_id uuid;
  v_public_manage_token text;
  v_token_attempt integer := 0;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  select
    s.organization_id,
    s.id,
    s.duration_min::integer,
    coalesce(s.cleanup_min, 0)::integer
  into
    v_organization_id,
    v_service_id,
    v_duration_min,
    v_buffer_min
  from public.services as s
  where s.id::text = p_service_id
    and s.active is true
  limit 1;

  if v_service_id is null or v_organization_id is null then
    raise exception 'service not found';
  end if;

  if not exists (
    select 1
    from public.organization_members as om
    where om.organization_id = v_organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'member')
  ) then
    raise exception 'owner only';
  end if;

  if btrim(coalesce(p_customer_name, '')) = '' then
    raise exception 'customer name is required';
  end if;

  if btrim(coalesce(p_customer_phone, '')) = '' then
    raise exception 'customer phone is required';
  end if;

  if p_date is null or p_start is null then
    raise exception 'reservation date and start time are required';
  end if;

  if v_duration_min is null or v_duration_min <= 0 then
    raise exception 'duration must be positive';
  end if;

  if v_buffer_min is null or v_buffer_min < 0 then
    raise exception 'buffer must be zero or positive';
  end if;

  v_end := (p_start + make_interval(mins => v_duration_min))::time;

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
      and r.start_time::time < (v_end::time + make_interval(mins => v_buffer_min))::time
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
    v_end,
    ((p_date + p_start) at time zone 'Asia/Seoul'),
    ((p_date + v_end) at time zone 'Asia/Seoul'),
    v_duration_min,
    v_buffer_min,
    'confirmed',
    btrim(p_customer_name),
    btrim(p_customer_phone),
    v_public_manage_token,
    now()
  )
  returning id into v_reservation_id;

  return v_reservation_id;
end;
$$;

revoke all on function public.create_owner_reservation(text, date, time, text, text) from public;
grant execute on function public.create_owner_reservation(text, date, time, text, text) to authenticated;
