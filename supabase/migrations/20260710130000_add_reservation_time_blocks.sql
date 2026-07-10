create extension if not exists pgcrypto with schema extensions;

create table if not exists public.reservation_time_blocks (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  block_date date not null,
  start_time time not null,
  end_time time not null,
  reason text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservation_time_blocks_time_check check (start_time < end_time)
);

create index if not exists reservation_time_blocks_org_date_idx
  on public.reservation_time_blocks (organization_id, block_date);

create index if not exists reservation_time_blocks_org_date_time_idx
  on public.reservation_time_blocks (organization_id, block_date, start_time, end_time);

alter table public.reservation_time_blocks enable row level security;

drop policy if exists "reservation time blocks are visible to organization members"
  on public.reservation_time_blocks;
create policy "reservation time blocks are visible to organization members"
  on public.reservation_time_blocks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members as om
      where om.organization_id = reservation_time_blocks.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'member')
    )
  );

drop policy if exists "reservation time blocks are created by organization members"
  on public.reservation_time_blocks;
create policy "reservation time blocks are created by organization members"
  on public.reservation_time_blocks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.organization_members as om
      where om.organization_id = reservation_time_blocks.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'member')
    )
  );

drop policy if exists "reservation time blocks are updated by organization members"
  on public.reservation_time_blocks;
create policy "reservation time blocks are updated by organization members"
  on public.reservation_time_blocks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members as om
      where om.organization_id = reservation_time_blocks.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'member')
    )
  )
  with check (
    exists (
      select 1
      from public.organization_members as om
      where om.organization_id = reservation_time_blocks.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'member')
    )
  );

drop policy if exists "reservation time blocks are deleted by organization members"
  on public.reservation_time_blocks;
create policy "reservation time blocks are deleted by organization members"
  on public.reservation_time_blocks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.organization_members as om
      where om.organization_id = reservation_time_blocks.organization_id
        and om.user_id = auth.uid()
        and om.role in ('owner', 'member')
    )
  );

drop function if exists public.create_reservation_time_block(date, time, time, text);

create function public.create_reservation_time_block(
  p_block_date date,
  p_start_time time,
  p_end_time time,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_block_id uuid;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  select om.organization_id
  into v_organization_id
  from public.organization_members as om
  where om.user_id = auth.uid()
    and om.role in ('owner', 'member')
  order by om.created_at asc nulls last
  limit 1;

  if v_organization_id is null then
    raise exception 'owner only';
  end if;

  if p_block_date is null or p_start_time is null or p_end_time is null then
    raise exception 'date and time are required';
  end if;

  if p_start_time >= p_end_time then
    raise exception 'end time must be after start time';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_organization_id::text || ':' || p_block_date::text, 0)
  );

  if exists (
    select 1
    from public.reservations as r
    where r.organization_id = v_organization_id
      and r.date = p_block_date
      and coalesce(r.status, 'confirmed') not in ('cancelled', 'canceled')
      and r.start_time is not null
      and r.end_time is not null
      and p_start_time < (r.end_time::time + make_interval(mins => coalesce(r.buffer_min, 0)))::time
      and r.start_time::time < p_end_time
  ) then
    raise exception 'active reservation overlap';
  end if;

  if exists (
    select 1
    from public.reservation_time_blocks as b
    where b.organization_id = v_organization_id
      and b.block_date = p_block_date
      and p_start_time < b.end_time
      and b.start_time < p_end_time
  ) then
    raise exception 'time block overlap';
  end if;

  insert into public.reservation_time_blocks (
    organization_id,
    block_date,
    start_time,
    end_time,
    reason,
    created_by,
    updated_at
  )
  values (
    v_organization_id,
    p_block_date,
    p_start_time,
    p_end_time,
    nullif(left(btrim(coalesce(p_reason, '')), 120), ''),
    auth.uid(),
    now()
  )
  returning id into v_block_id;

  return v_block_id;
end;
$$;

revoke all on function public.create_reservation_time_block(date, time, time, text) from public;
grant execute on function public.create_reservation_time_block(date, time, time, text) to authenticated;

drop function if exists public.delete_reservation_time_block(uuid);

create function public.delete_reservation_time_block(
  p_block_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_block public.reservation_time_blocks%rowtype;
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;

  select *
  into v_block
  from public.reservation_time_blocks as b
  where b.id = p_block_id;

  if v_block.id is null then
    raise exception 'time block not found';
  end if;

  if not exists (
    select 1
    from public.organization_members as om
    where om.organization_id = v_block.organization_id
      and om.user_id = auth.uid()
      and om.role in ('owner', 'member')
  ) then
    raise exception 'owner only';
  end if;

  delete from public.reservation_time_blocks as b
  where b.id = p_block_id;

  return p_block_id;
end;
$$;

revoke all on function public.delete_reservation_time_block(uuid) from public;
grant execute on function public.delete_reservation_time_block(uuid) to authenticated;

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

  union all

  select
    b.start_time::time,
    b.end_time::time
  from public.reservation_time_blocks as b
  join public.organizations as o
    on o.id = b.organization_id
  where o.handle = lower(btrim(p_handle))
    and b.block_date = p_date

  order by start_time asc;
$$;

revoke all on function public.get_busy_by_handle_date(text, date) from public;
grant execute on function public.get_busy_by_handle_date(text, date) to anon;
grant execute on function public.get_busy_by_handle_date(text, date) to authenticated;

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

  if exists (
    select 1
    from public.reservation_time_blocks as b
    where b.organization_id = v_organization_id
      and b.block_date = p_date
      and p_start < b.end_time
      and b.start_time < (p_end::time + make_interval(mins => p_buffer_min))::time
  ) then
    raise exception 'selected time is blocked';
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

create or replace function public.create_owner_reservation(
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

  if exists (
    select 1
    from public.reservation_time_blocks as b
    where b.organization_id = v_organization_id
      and b.block_date = p_date
      and p_start < b.end_time
      and b.start_time < (v_end::time + make_interval(mins => v_buffer_min))::time
  ) then
    raise exception 'selected time is blocked';
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

create or replace function public.update_owner_reservation(
  p_reservation_id uuid,
  p_service_id text,
  p_customer_name text,
  p_customer_phone text,
  p_date date,
  p_start time
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
begin
  select r.organization_id
  into v_organization_id
  from public.reservations as r
  where r.id = p_reservation_id
  limit 1;

  if v_organization_id is null then
    raise exception 'reservation not found';
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

  select s.id, s.duration_min::integer, coalesce(s.cleanup_min, 0)::integer
  into v_service_id, v_duration_min, v_buffer_min
  from public.services as s
  where s.id::text = p_service_id
    and s.organization_id = v_organization_id
    and s.active is true
  limit 1;

  if v_service_id is null then
    raise exception 'service not found';
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

  v_end := (p_start + make_interval(mins => v_duration_min))::time;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_organization_id::text || ':' || p_date::text, 0)
  );

  if exists (
    select 1
    from public.reservations as r
    where r.organization_id = v_organization_id
      and r.id <> p_reservation_id
      and r.date = p_date
      and coalesce(r.status, 'confirmed') not in ('cancelled', 'canceled')
      and r.start_time is not null
      and r.end_time is not null
      and p_start < (r.end_time::time + make_interval(mins => coalesce(r.buffer_min, 0)))::time
      and r.start_time::time < (v_end::time + make_interval(mins => v_buffer_min))::time
  ) then
    raise exception 'selected time is no longer available';
  end if;

  if exists (
    select 1
    from public.reservation_time_blocks as b
    where b.organization_id = v_organization_id
      and b.block_date = p_date
      and p_start < b.end_time
      and b.start_time < (v_end::time + make_interval(mins => v_buffer_min))::time
  ) then
    raise exception 'selected time is blocked';
  end if;

  update public.reservations as r
  set
    service_id = v_service_id::text,
    customer_name = btrim(p_customer_name),
    customer_phone = btrim(p_customer_phone),
    date = p_date,
    start_time = p_start,
    end_time = v_end,
    start_at = ((p_date + p_start) at time zone 'Asia/Seoul'),
    end_at = ((p_date + v_end) at time zone 'Asia/Seoul'),
    duration_min = v_duration_min,
    buffer_min = v_buffer_min
  where r.id = p_reservation_id
    and r.organization_id = v_organization_id;

  return p_reservation_id;
end;
$$;

revoke all on function public.update_owner_reservation(
  uuid,
  text,
  text,
  text,
  date,
  time
) from public;

grant execute on function public.update_owner_reservation(
  uuid,
  text,
  text,
  text,
  date,
  time
) to authenticated;
