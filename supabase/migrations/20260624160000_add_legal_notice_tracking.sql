create table if not exists public.legal_notices (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('terms', 'privacy')),
  version text not null,
  title text not null,
  body text not null,
  sent_at timestamptz null,
  created_at timestamptz not null default now()
);

comment on table public.legal_notices is
  'Stores future terms/privacy update notices. TODO: implement legal notice email sender with Resend after admin workflow is ready.';

create table if not exists public.legal_notice_recipients (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.legal_notices(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  email text not null,
  sent_at timestamptz null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error_message text null,
  created_at timestamptz not null default now()
);

comment on table public.legal_notice_recipients is
  'Tracks per-recipient delivery status for future legal update emails. TODO: implement recipient population and delivery after admin workflow is ready.';

create index if not exists legal_notices_type_version_idx
  on public.legal_notices(type, version);

create index if not exists legal_notice_recipients_notice_id_idx
  on public.legal_notice_recipients(notice_id);

create index if not exists legal_notice_recipients_user_id_idx
  on public.legal_notice_recipients(user_id);

create index if not exists legal_notice_recipients_status_idx
  on public.legal_notice_recipients(status);

alter table public.legal_notices enable row level security;
alter table public.legal_notice_recipients enable row level security;
