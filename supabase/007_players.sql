-- Player standings for the leaderboard. Stats come from the BF2Statistics
-- database (see scripts/bf2stats_to_sql.py); external_id is the BF2 player id.
-- Rank is derived from score automatically (lib/ranks.js); rank_override is
-- for ranks that score alone can't determine (First Sergeant, Sergeant Major,
-- Major General, General, etc.).
--
-- Run this once in the Supabase SQL editor. Safe to re-run.

create table if not exists public.bf2_players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score integer not null default 0 check (score >= 0),
  rank_override smallint check (rank_override between 0 and 21),
  created_at timestamptz not null default now()
);

alter table public.bf2_players
  add column if not exists external_id bigint unique,
  add column if not exists rounds integer,
  add column if not exists wins integer,
  add column if not exists losses integer,
  add column if not exists kills integer,
  add column if not exists deaths integer,
  add column if not exists play_seconds integer,
  add column if not exists country text,
  add column if not exists last_online timestamptz;

create index if not exists bf2_players_score_idx on public.bf2_players (score desc);

alter table public.bf2_players enable row level security;

drop policy if exists "Public read players" on public.bf2_players;
create policy "Public read players" on public.bf2_players
  for select using (true);

drop policy if exists "Admin insert players" on public.bf2_players;
create policy "Admin insert players" on public.bf2_players
  for insert to authenticated with check (true);

drop policy if exists "Admin update players" on public.bf2_players;
create policy "Admin update players" on public.bf2_players
  for update to authenticated using (true) with check (true);

drop policy if exists "Admin delete players" on public.bf2_players;
create policy "Admin delete players" on public.bf2_players
  for delete to authenticated using (true);
