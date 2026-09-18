-- Player standings for the leaderboard. Each player has a total score and
-- an in-game rank badge. The rank is derived from score automatically
-- (see lib/ranks.js); rank_override is for ranks that score alone can't
-- determine (First Sergeant, Sergeant Major, Major General, General, etc.).
--
-- Run this once in the Supabase SQL editor.

create table if not exists public.bf2_players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score integer not null default 0 check (score >= 0),
  rank_override smallint check (rank_override between 0 and 21),
  created_at timestamptz not null default now()
);

create index if not exists bf2_players_score_idx on public.bf2_players (score desc);

alter table public.bf2_players enable row level security;

create policy "Public read players" on public.bf2_players
  for select using (true);

create policy "Admin insert players" on public.bf2_players
  for insert to authenticated with check (true);
create policy "Admin update players" on public.bf2_players
  for update to authenticated using (true) with check (true);
create policy "Admin delete players" on public.bf2_players
  for delete to authenticated using (true);
