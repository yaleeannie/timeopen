alter table public.organizations
  add column if not exists owner_sms_notifications_enabled boolean not null default false,
  add column if not exists owner_notification_phone text null;

comment on column public.organizations.owner_sms_notifications_enabled is
  'Controls whether the shop owner receives SMS alerts for important reservation events.';

comment on column public.organizations.owner_notification_phone is
  'Phone number configured by the owner to receive owner-facing reservation alerts. Do not fall back to owner email or customer-facing booking_contact.';

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
  booking_notice text,
  public_manage_token text,
  owner_sms_notifications_enabled boolean,
  owner_notification_phone text
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
    coalesce(o.booking_notice, '')::text,
    coalesce(r.public_manage_token, '')::text,
    coalesce(o.owner_sms_notifications_enabled, false)::boolean,
    coalesce(o.owner_notification_phone, '')::text
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

drop function if exists public.cancel_public_reservation_by_manage_token(text);

create function public.cancel_public_reservation_by_manage_token(p_token text)
returns table (
  reservation_id uuid,
  reservation_date date,
  start_time time,
  reservation_status text,
  organization_name text,
  service_name text,
  booking_contact text,
  customer_name text,
  customer_phone text,
  owner_sms_notifications_enabled boolean,
  owner_notification_phone text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reservation_id uuid;
  v_start_at timestamptz;
  v_status text;
begin
  select
    r.id,
    r.start_at,
    coalesce(r.status, 'confirmed')
  into
    v_reservation_id,
    v_start_at,
    v_status
  from public.reservations as r
  where r.public_manage_token = nullif(btrim(p_token), '')
  for update;

  if v_reservation_id is null then
    raise exception 'reservation not found';
  end if;

  if v_status in ('cancelled', 'canceled') then
    raise exception 'reservation already cancelled';
  end if;

  if now() > (v_start_at - interval '3 days') then
    raise exception 'cancellation window closed';
  end if;

  update public.reservations as r
  set
    status = 'cancelled',
    canceled_at = now()
  where r.id = v_reservation_id;

  return query
  select
    r.id,
    r.date::date,
    r.start_time::time,
    coalesce(r.status, 'confirmed')::text,
    coalesce(o.name, o.handle, '')::text,
    coalesce(s.name, '')::text,
    coalesce(o.booking_contact, '')::text,
    coalesce(r.customer_name, '')::text,
    coalesce(r.customer_phone, '')::text,
    coalesce(o.owner_sms_notifications_enabled, false)::boolean,
    coalesce(o.owner_notification_phone, '')::text
  from public.reservations as r
  join public.organizations as o
    on o.id = r.organization_id
  left join public.services as s
    on s.id::text = r.service_id
   and s.organization_id = r.organization_id
  where r.id = v_reservation_id
  limit 1;
end;
$$;

revoke all on function public.cancel_public_reservation_by_manage_token(text) from public;
grant execute on function public.cancel_public_reservation_by_manage_token(text) to anon;
grant execute on function public.cancel_public_reservation_by_manage_token(text) to authenticated;
