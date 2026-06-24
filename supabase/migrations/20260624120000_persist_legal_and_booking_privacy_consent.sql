alter table public.reservations
  add column if not exists customer_privacy_agreed_at timestamptz null,
  add column if not exists customer_privacy_policy_version text not null default '2026-06-24';

alter table public.organization_members
  add column if not exists terms_agreed_at timestamptz null,
  add column if not exists privacy_agreed_at timestamptz null,
  add column if not exists marketing_agreed_at timestamptz null,
  add column if not exists legal_terms_version text null,
  add column if not exists privacy_policy_version text null;

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

create or replace function public.bootstrap_owner()
returns table (
  organization_id uuid,
  handle text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_organization_id uuid;
  v_handle text;
  v_user_metadata jsonb := '{}'::jsonb;
  v_terms_agreed_at timestamptz;
  v_privacy_agreed_at timestamptz;
  v_marketing_agreed_at timestamptz;
  v_legal_terms_version text;
  v_privacy_policy_version text;
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(u.raw_user_meta_data, '{}'::jsonb)
  into v_user_metadata
  from auth.users as u
  where u.id = v_user_id;

  v_terms_agreed_at := nullif(v_user_metadata->>'terms_agreed_at', '')::timestamptz;
  v_privacy_agreed_at := nullif(v_user_metadata->>'privacy_agreed_at', '')::timestamptz;
  v_marketing_agreed_at := nullif(v_user_metadata->>'marketing_agreed_at', '')::timestamptz;
  v_legal_terms_version := nullif(v_user_metadata->>'legal_terms_version', '');
  v_privacy_policy_version := nullif(v_user_metadata->>'privacy_policy_version', '');

  -- Serialize bootstrap attempts for the same user so concurrent requests
  -- cannot create multiple organizations before a membership is visible.
  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  select
    om.organization_id,
    o.handle
  into
    v_organization_id,
    v_handle
  from public.organization_members as om
  join public.organizations as o
    on o.id = om.organization_id
  where om.user_id = v_user_id
    and om.role = 'owner'
  order by om.organization_id
  limit 1;

  if v_organization_id is null then
    insert into public.organizations (
      name,
      plan_type,
      subscription_status,
      booking_slot_mode
    )
    values (
      '내 샵',
      'beta',
      'active',
      'flexible'
    )
    returning
      id,
      organizations.handle
    into
      v_organization_id,
      v_handle;

    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      terms_agreed_at,
      privacy_agreed_at,
      marketing_agreed_at,
      legal_terms_version,
      privacy_policy_version
    )
    values (
      v_organization_id,
      v_user_id,
      'owner',
      v_terms_agreed_at,
      v_privacy_agreed_at,
      v_marketing_agreed_at,
      v_legal_terms_version,
      v_privacy_policy_version
    );
  else
    update public.organization_members as om
    set
      terms_agreed_at = coalesce(om.terms_agreed_at, v_terms_agreed_at),
      privacy_agreed_at = coalesce(om.privacy_agreed_at, v_privacy_agreed_at),
      marketing_agreed_at = coalesce(om.marketing_agreed_at, v_marketing_agreed_at),
      legal_terms_version = coalesce(om.legal_terms_version, v_legal_terms_version),
      privacy_policy_version = coalesce(om.privacy_policy_version, v_privacy_policy_version)
    where om.organization_id = v_organization_id
      and om.user_id = v_user_id
      and om.role = 'owner';
  end if;

  return query
  select
    v_organization_id,
    v_handle;
end;
$$;

revoke all on function public.bootstrap_owner() from public;
revoke all on function public.bootstrap_owner() from anon;
grant execute on function public.bootstrap_owner() to authenticated;
