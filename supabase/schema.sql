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

create table if not exists public.gallery_cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_path text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gallery_card_votes (
  id uuid primary key default gen_random_uuid(),
  gallery_card_id uuid not null references public.gallery_cards(id) on delete cascade,
  voter_token text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (gallery_card_id, voter_token)
);

alter table public.households alter column household_name drop not null;
alter table public.dogs add column if not exists cartoon_storage_path text;
alter table public.dogs add column if not exists cartoon_content_type text;
alter table public.dogs add column if not exists consent_to_gallery boolean not null default false;

create index if not exists dogs_household_id_idx on public.dogs (household_id);
create index if not exists gallery_cards_sort_order_idx on public.gallery_cards (sort_order, created_at);
create index if not exists gallery_card_votes_card_id_idx on public.gallery_card_votes (gallery_card_id);
create index if not exists gallery_card_votes_voter_token_idx on public.gallery_card_votes (voter_token);

alter table public.households enable row level security;
alter table public.dogs enable row level security;
alter table public.gallery_cards enable row level security;
alter table public.gallery_card_votes enable row level security;

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

drop policy if exists "service role full access for gallery cards" on public.gallery_cards;
create policy "service role full access for gallery cards"
on public.gallery_cards
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role full access for gallery card votes" on public.gallery_card_votes;
create policy "service role full access for gallery card votes"
on public.gallery_card_votes
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Create a public bucket or switch to signed URLs if you want stricter object access.
insert into storage.buckets (id, name, public)
values ('dachshund-photos', 'dachshund-photos', false)
on conflict (id) do nothing;
