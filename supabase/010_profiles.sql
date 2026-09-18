-- Player profile data: full stats per player plus earned awards (medals,
-- ribbons, badges). Public read, admin write, like the other tables.
--
-- Run this once in the Supabase SQL editor, after 007_players.sql. Safe to re-run.

alter table public.bf2_players add column if not exists stats jsonb;

create table if not exists public.bf2_awards (
  id integer primary key,                 -- BF2 award id, also the icon file name
  name text not null,
  category text not null check (category in ('Badges', 'Other Badges', 'Medals', 'Ribbons')),
  stages jsonb not null default '[]'::jsonb,   -- [{stage, requirements[]}]
  sort_order integer not null
);

create table if not exists public.bf2_player_awards (
  player_id uuid not null references public.bf2_players(id) on delete cascade,
  award_id integer not null references public.bf2_awards(id) on delete cascade,
  level integer not null default 1,       -- medals/ribbons: times earned; badges: 1 Basic, 2 Veteran, 3 Expert
  first_earned timestamptz,
  last_earned timestamptz,
  primary key (player_id, award_id)
);

create index if not exists bf2_player_awards_award_idx on public.bf2_player_awards (award_id);

alter table public.bf2_awards enable row level security;
alter table public.bf2_player_awards enable row level security;

drop policy if exists "Public read awards" on public.bf2_awards;
create policy "Public read awards" on public.bf2_awards for select using (true);

drop policy if exists "Public read player awards" on public.bf2_player_awards;
create policy "Public read player awards" on public.bf2_player_awards for select using (true);

drop policy if exists "Admin write awards" on public.bf2_awards;
create policy "Admin write awards" on public.bf2_awards
  for all to authenticated using (true) with check (true);

drop policy if exists "Admin write player awards" on public.bf2_player_awards;
create policy "Admin write player awards" on public.bf2_player_awards
  for all to authenticated using (true) with check (true);
