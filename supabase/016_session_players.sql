-- Which human players took part in each session, filled by the stats import
-- (imports/<dump>/5_session_players.sql). Bots are never recorded here.
-- Public read; only admins can change it. Safe to re-run.
create table if not exists public.bf2_session_players (
  log_id uuid not null references public.bf2_game_logs(id) on delete cascade,
  player_id uuid not null references public.bf2_players(id) on delete cascade,
  primary key (log_id, player_id)
);

create index if not exists bf2_session_players_player_idx on public.bf2_session_players (player_id);

alter table public.bf2_session_players enable row level security;

drop policy if exists "Public read session players" on public.bf2_session_players;
create policy "Public read session players" on public.bf2_session_players for select using (true);

drop policy if exists "Admin write session players" on public.bf2_session_players;
create policy "Admin write session players" on public.bf2_session_players
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
