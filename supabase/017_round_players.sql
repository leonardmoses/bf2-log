-- Per-round, per-player results (score, kills, deaths, time played) for the round detail
-- page. Filled by the stats import (imports/<dump>/6_round_players.sql). Purely additive:
-- a new table, no change to any existing table, row or policy.
--
-- Includes bots as well as humans (is_human marks which is which) since the data costs
-- nothing extra to keep, even though the round page shows humans by default.
--
-- Public read; only admins can change it. Safe to re-run.
create table if not exists public.bf2_round_players (
  log_id uuid not null references public.bf2_game_logs(id) on delete cascade,
  player_id uuid not null references public.bf2_players(id) on delete cascade,
  score integer not null default 0,
  cmd_score integer not null default 0,
  skill_score integer not null default 0,
  team_score integer not null default 0,
  kills integer not null default 0,
  deaths integer not null default 0,
  play_seconds integer not null default 0,
  rank_at_time integer,
  is_human boolean not null default false,
  primary key (log_id, player_id)
);

create index if not exists bf2_round_players_player_idx on public.bf2_round_players (player_id);

alter table public.bf2_round_players enable row level security;

drop policy if exists "Public read round players" on public.bf2_round_players;
create policy "Public read round players" on public.bf2_round_players for select using (true);

drop policy if exists "Admin write round players" on public.bf2_round_players;
create policy "Admin write round players" on public.bf2_round_players
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
