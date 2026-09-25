-- Formalizes the stats_round_id column as a real migration. It already exists on the live
-- database (added by an earlier dump's 4_rounds.sql, back when the first rounds were
-- imported), so this is a no-op there. It only matters for validating a dump on its own
-- from a fresh database, when that dump's own 4_rounds.sql isn't part of the test (no new
-- or re-linked rounds that time). Safe to re-run.
alter table public.bf2_game_logs add column if not exists stats_round_id bigint unique;
