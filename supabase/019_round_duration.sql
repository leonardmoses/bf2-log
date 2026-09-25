-- How long a round lasted, in seconds. Nullable and purely additive: existing (hand-entered)
-- session rows are unaffected and simply have no duration. Filled in by the stats import
-- (imports/<dump>/4_rounds.sql) for every round that has stats data, not just new ones.
-- Safe to re-run.
alter table public.bf2_game_logs add column if not exists duration_seconds integer;
