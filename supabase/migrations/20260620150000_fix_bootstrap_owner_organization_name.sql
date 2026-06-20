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
      plan
    )
    values (
      '내 매장',
      'trial'
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
