create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid null references public.organizations(id) on delete set null,
  reservation_id uuid null references public.reservations(id) on delete set null,
  recipient_type text not null check (recipient_type in ('owner', 'customer')),
  message_type text not null check (message_type in ('booking_confirm', 'booking_cancel')),
  to_phone text null,
  country_code text null,
  status text not null check (status in ('success', 'failed', 'skipped')),
  provider text not null default 'solapi',
  provider_message_id text null,
  provider_status_code integer null,
  error_message text null,
  request_payload jsonb null,
  response_payload jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists sms_logs_organization_created_at_idx
  on public.sms_logs (organization_id, created_at desc);

create index if not exists sms_logs_reservation_id_idx
  on public.sms_logs (reservation_id);

create index if not exists sms_logs_status_idx
  on public.sms_logs (status);

alter table public.sms_logs enable row level security;

revoke all on table public.sms_logs from anon;
revoke insert, update, delete on table public.sms_logs from authenticated;
grant select on table public.sms_logs to authenticated;

drop policy if exists "owners can view organization sms logs" on public.sms_logs;
create policy "owners can view organization sms logs"
on public.sms_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.organization_members as om
    where om.organization_id = sms_logs.organization_id
      and om.user_id = auth.uid()
      and om.role = 'owner'
  )
);

create or replace function public.log_sms_attempt(
  p_handle text,
  p_reservation_id uuid,
  p_recipient_type text,
  p_message_type text,
  p_to_phone text,
  p_country_code text,
  p_status text,
  p_provider text,
  p_provider_message_id text,
  p_provider_status_code integer,
  p_error_message text,
  p_request_payload jsonb,
  p_response_payload jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_log_id uuid;
begin
  if p_recipient_type not in ('owner', 'customer') then
    raise exception 'invalid recipient_type';
  end if;

  if p_message_type not in ('booking_confirm', 'booking_cancel') then
    raise exception 'invalid message_type';
  end if;

  if p_status not in ('success', 'failed', 'skipped') then
    raise exception 'invalid status';
  end if;

  select r.organization_id
    into v_organization_id
  from public.reservations as r
  join public.organizations as o
    on o.id = r.organization_id
  where r.id = p_reservation_id
    and o.handle = lower(btrim(p_handle))
  limit 1;

  if v_organization_id is null then
    raise exception 'reservation not found for handle';
  end if;

  insert into public.sms_logs (
    organization_id,
    reservation_id,
    recipient_type,
    message_type,
    to_phone,
    country_code,
    status,
    provider,
    provider_message_id,
    provider_status_code,
    error_message,
    request_payload,
    response_payload
  )
  values (
    v_organization_id,
    p_reservation_id,
    p_recipient_type,
    p_message_type,
    nullif(btrim(p_to_phone), ''),
    nullif(btrim(p_country_code), ''),
    p_status,
    coalesce(nullif(btrim(p_provider), ''), 'solapi'),
    nullif(btrim(p_provider_message_id), ''),
    p_provider_status_code,
    nullif(left(p_error_message, 2000), ''),
    p_request_payload,
    p_response_payload
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

revoke all on function public.log_sms_attempt(
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  text,
  jsonb,
  jsonb
) from public;

grant execute on function public.log_sms_attempt(
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  text,
  jsonb,
  jsonb
) to anon;

grant execute on function public.log_sms_attempt(
  text,
  uuid,
  text,
  text,
  text,
  text,
  text,
  text,
  text,
  integer,
  text,
  jsonb,
  jsonb
) to authenticated;
