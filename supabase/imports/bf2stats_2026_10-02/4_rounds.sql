-- Rounds from the stats dump bf2stats_2026_10-02.
-- * Rounds matching a session you logged by hand get the real date and a link to the
--   stats round; that session keeps its size, bots and difficulty.
-- * The other 3-8 player rounds are inserted new. Size is inferred (see scripts/bf2stats_config.py),
--   difficulty is left blank: fill it in with Edit in admin.
-- * Round duration is (re)filled in for every round with a log row here, not just new ones,
--   so it stays correct as the raw dump's duration figure changes or gets backfilled.
-- Safe to re-run (each round is linked by stats_round_id and only ever imported once).

alter table public.bf2_game_logs add column if not exists stats_round_id bigint unique;
alter table public.bf2_game_logs add column if not exists duration_seconds integer;

-- New rounds
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 21), 3, 16, 30, 'loss', null, '2026-10-01', 'Imported from stats round #107 (size assumed)', 107) on conflict (stats_round_id) do nothing;  -- karkand_stormfront
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 21), 3, 16, 30, 'win', null, '2026-10-01', 'Imported from stats round #108 (size assumed)', 108) on conflict (stats_round_id) do nothing;  -- karkand_stormfront
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 29), 4, 16, 40, 'win', null, '2026-10-01', 'Imported from stats round #109 (size assumed)', 109) on conflict (stats_round_id) do nothing;  -- sf_op_harvest
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 23), 3, 16, 30, 'loss', null, '2026-10-01', 'Imported from stats round #110 (size assumed)', 110) on conflict (stats_round_id) do nothing;  -- mass_destruction
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 23), 4, 16, 30, 'win', null, '2026-10-01', 'Imported from stats round #111 (size assumed)', 111) on conflict (stats_round_id) do nothing;  -- mass_destruction
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 23), 4, 16, 40, 'win', null, '2026-10-02', 'Imported from stats round #112 (size assumed)', 112) on conflict (stats_round_id) do nothing;  -- mass_destruction
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes, stats_round_id) values ((select id from public.bf2_maps where sort_order = 28), 4, 16, 40, 'win', null, '2026-10-02', 'Imported from stats round #113 (size assumed)', 113) on conflict (stats_round_id) do nothing;  -- sf_midnight_sun

-- Round duration (seconds), for every round that has a log row
update public.bf2_game_logs as l set duration_seconds = v.duration_seconds
from (values
  (2, 2944),
  (3, 1664),
  (4, 7936),
  (5, 1280),
  (6, 1024),
  (7, 1664),
  (8, 896),
  (9, 896),
  (10, 3456),
  (11, 1792),
  (12, 768),
  (13, 1408),
  (14, 768),
  (15, 512),
  (16, 1664),
  (17, 1664),
  (20, 1024),
  (21, 768),
  (22, 3200),
  (23, 4096),
  (28, 1280),
  (29, 1664),
  (30, 1536),
  (31, 1408),
  (32, 3072),
  (33, 1920),
  (34, 7808),
  (35, 2048),
  (36, 1408),
  (37, 1792),
  (38, 128),
  (39, 896),
  (40, 1280),
  (41, 640),
  (42, 4224),
  (43, 384),
  (44, 384),
  (45, 640),
  (48, 1536),
  (49, 1664),
  (50, 256),
  (51, 1920),
  (52, 512),
  (53, 4224),
  (54, 2688),
  (59, 1280),
  (60, 3968),
  (61, 896),
  (62, 2432),
  (65, 1664),
  (66, 1280),
  (67, 2688),
  (68, 1792),
  (69, 3328),
  (73, 2176),
  (74, 4352),
  (75, 1536),
  (76, 4096),
  (77, 512),
  (78, 2688),
  (79, 896),
  (80, 1280),
  (81, 3712),
  (84, 2944),
  (85, 2176),
  (86, 1280),
  (87, 768),
  (88, 1024),
  (89, 2816),
  (90, 2176),
  (91, 2688),
  (92, 1792),
  (93, 3200),
  (94, 3968),
  (95, 128),
  (96, 2176),
  (97, 1280),
  (98, 1024),
  (99, 512),
  (100, 2304),
  (101, 1280),
  (102, 384),
  (103, 768),
  (104, 896),
  (105, 1408),
  (106, 1664),
  (107, 768),
  (108, 1408),
  (109, 512),
  (110, 256),
  (111, 1152),
  (112, 1024),
  (113, 2176)
) as v(round_id, duration_seconds)
where l.stats_round_id = v.round_id;
