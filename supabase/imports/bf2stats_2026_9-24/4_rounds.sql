-- Rounds from the stats dump bf2stats_2026_9-24.
-- * Rounds matching a session you logged by hand get the real date and a link to the
--   stats round; that session keeps its size, bots and difficulty.
-- * The other 3-8 player rounds are inserted new. Size is inferred (see scripts/bf2stats_config.py),
--   difficulty is left blank: fill it in with Edit in admin.
-- Safe to re-run (each round is linked by stats_round_id and only ever imported once).

alter table public.bf2_game_logs add column if not exists stats_round_id bigint unique;

-- New rounds
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 19), 3, 16, 20, 'win', null, '2026-09-24', 'Imported from stats round #105 (size assumed)', 105) on conflict (stats_round_id) do nothing;  -- gulf_of_oman
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 19), 3, 16, 30, 'win', null, '2026-09-24', 'Imported from stats round #106 (size assumed)', 106) on conflict (stats_round_id) do nothing;  -- gulf_of_oman
