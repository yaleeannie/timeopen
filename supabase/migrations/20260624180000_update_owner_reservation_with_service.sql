drop function if exists public.update_owner_reservation(uuid, text, text, date, time, time);

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
