create or replace function public.update_owner_reservation(
  p_reservation_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_date date,
  p_start time,
  p_end time default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_duration_min integer;
  v_end time;
begin
  select r.organization_id, r.duration_min
  into v_organization_id, v_duration_min
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

  if btrim(coalesce(p_customer_name, '')) = '' then
    raise exception 'customer name is required';
  end if;

  if btrim(coalesce(p_customer_phone, '')) = '' then
    raise exception 'customer phone is required';
  end if;

  if p_date is null or p_start is null then
    raise exception 'reservation date and start time are required';
  end if;

  v_end := coalesce(p_end, (p_start + make_interval(mins => v_duration_min))::time);

  if v_end <= p_start then
    raise exception 'reservation end time must be after start time';
  end if;

  update public.reservations as r
  set
    customer_name = btrim(p_customer_name),
    customer_phone = btrim(p_customer_phone),
    date = p_date,
    start_time = p_start,
    end_time = v_end,
    start_at = ((p_date + p_start) at time zone 'Asia/Seoul'),
    end_at = ((p_date + v_end) at time zone 'Asia/Seoul')
  where r.id = p_reservation_id
    and r.organization_id = v_organization_id;

  return p_reservation_id;
end;
$$;

revoke all on function public.update_owner_reservation(
  uuid,
  text,
  text,
  date,
  time,
  time
) from public;

grant execute on function public.update_owner_reservation(
  uuid,
  text,
  text,
  date,
  time,
  time
) to authenticated;
