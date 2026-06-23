alter table public.organizations
  add column if not exists link_theme text null default 'glow';

alter table public.organizations
  drop constraint if exists organizations_link_theme_check;

alter table public.organizations
  add constraint organizations_link_theme_check
  check (
    link_theme is null
    or link_theme in ('minimal', 'beauty', 'simple', 'glow')
  );
