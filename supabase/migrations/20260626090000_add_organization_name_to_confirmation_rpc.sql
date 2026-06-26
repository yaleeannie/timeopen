drop function if exists public.get_public_reservation_confirmation(text, uuid);

create function public.get_public_reservation_confirmation(
  p_handle text,
  p_reservation_id uuid
)
returns table (
  reservation_date date,
  start_time time,
  end_time time,
  organization_name text,
  service_name text,
  service_name_translations jsonb,
  customer_name text,
  customer_phone text,
  location_text text,
  notice_text text,
  booking_contact text
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
    coalesce(o.name, o.handle, '')::text,
    coalesce(s.name, '')::text,
    coalesce(s.name_translations, '{}'::jsonb),
    coalesce(r.customer_name, '')::text,
    coalesce(r.customer_phone, '')::text,
    coalesce(o.location_text, '')::text,
    coalesce(o.notice_text, '')::text,
    coalesce(o.booking_contact, '')::text
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
