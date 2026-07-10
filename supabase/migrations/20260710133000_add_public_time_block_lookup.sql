drop function if exists public.get_public_reservation_time_blocks(text, date);

create function public.get_public_reservation_time_blocks(
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
    b.start_time::time,
    b.end_time::time
  from public.reservation_time_blocks as b
  join public.organizations as o
    on o.id = b.organization_id
  where o.handle = lower(btrim(p_handle))
    and coalesce(o.booking_enabled, true) is true
    and o.withdrawal_requested_at is null
    and o.disabled_at is null
    and b.block_date = p_date
  order by b.start_time asc;
$$;

revoke all on function public.get_public_reservation_time_blocks(text, date) from public;
grant execute on function public.get_public_reservation_time_blocks(text, date) to anon;
grant execute on function public.get_public_reservation_time_blocks(text, date) to authenticated;
