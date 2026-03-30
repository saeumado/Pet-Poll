create table if not exists public.creative_cards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  display_name text not null,
  image_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.creative_card_votes (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.creative_cards(id) on delete cascade,
  voter_token text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (card_id, voter_token)
);

create index if not exists creative_cards_sort_order_idx on public.creative_cards (sort_order, created_at);
create index if not exists creative_card_votes_card_id_idx on public.creative_card_votes (card_id);
create index if not exists creative_card_votes_voter_token_idx on public.creative_card_votes (voter_token);

alter table public.creative_cards enable row level security;
alter table public.creative_card_votes enable row level security;

drop policy if exists "service role full access for creative cards" on public.creative_cards;
create policy "service role full access for creative cards"
on public.creative_cards
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role full access for creative card votes" on public.creative_card_votes;
create policy "service role full access for creative card votes"
on public.creative_card_votes
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');