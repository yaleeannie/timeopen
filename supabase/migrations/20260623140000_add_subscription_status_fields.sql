alter table public.organizations
  add column if not exists plan_type text,
  add column if not exists trial_started_at timestamptz null,
  add column if not exists trial_ends_at timestamptz null,
  add column if not exists beta_ends_at timestamptz null,
  add column if not exists billing_starts_at timestamptz null,
  add column if not exists paid_started_at timestamptz null,
  add column if not exists subscription_status text;

update public.organizations
set plan_type = 'beta'
where plan_type is null
  or plan_type not in ('beta', 'trial', 'paid', 'free', 'canceled');

update public.organizations
set subscription_status = 'active'
where subscription_status is null
  or subscription_status not in ('active', 'trialing', 'past_due', 'canceled');

alter table public.organizations
  alter column plan_type set default 'beta',
  alter column plan_type set not null,
  alter column subscription_status set default 'active',
  alter column subscription_status set not null;

alter table public.organizations
  drop constraint if exists organizations_plan_type_check;

alter table public.organizations
  add constraint organizations_plan_type_check
  check (plan_type in ('beta', 'trial', 'paid', 'free', 'canceled'));

alter table public.organizations
  drop constraint if exists organizations_subscription_status_check;

alter table public.organizations
  add constraint organizations_subscription_status_check
  check (subscription_status in ('active', 'trialing', 'past_due', 'canceled'));

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
begin
  if v_user_id is null then
    raise exception 'not authenticated';
  end if;

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
      plan,
      plan_type,
      subscription_status
    )
    values (
      '내 매장',
      'trial',
      'beta',
      'active'
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
      role
    )
    values (
      v_organization_id,
      v_user_id,
      'owner'
    );
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
