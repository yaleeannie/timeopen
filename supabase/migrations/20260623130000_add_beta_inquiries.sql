create table if not exists public.beta_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  shop_name text,
  shop_type text not null,
  current_booking_method text not null,
  pain_point text not null,
  monthly_booking_volume text not null,
  message text,
  created_at timestamptz not null default now()
);

alter table public.beta_inquiries enable row level security;

drop policy if exists "beta_inquiries_public_insert" on public.beta_inquiries;
create policy "beta_inquiries_public_insert"
on public.beta_inquiries
for insert
to anon, authenticated
with check (true);
