create extension if not exists "pgcrypto";

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  household_name text,
  dachshund_count integer not null check (dachshund_count > 0),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  storage_path text not null,
  cartoon_storage_path text,
  original_filename text,
  content_type text,
  cartoon_content_type text,
  consent_to_gallery boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.households alter column household_name drop not null;
alter table public.dogs add column if not exists cartoon_storage_path text;
alter table public.dogs add column if not exists cartoon_content_type text;
alter table public.dogs add column if not exists consent_to_gallery boolean not null default false;

create index if not exists dogs_household_id_idx on public.dogs (household_id);

alter table public.households enable row level security;
alter table public.dogs enable row level security;

drop policy if exists "service role full access for households" on public.households;
create policy "service role full access for households"
on public.households
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role full access for dogs" on public.dogs;
create policy "service role full access for dogs"
on public.dogs
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Create a public bucket or switch to signed URLs if you want stricter object access.
insert into storage.buckets (id, name, public)
values ('dachshund-photos', 'dachshund-photos', false)
on conflict (id) do nothing;
