-- Historical win/loss/difficulty totals migrated from the spreadsheet.
-- Each row below is a total count, not a single dated session, so
-- played_at is left NULL (requires 004_allow_null_played_at.sql first)
-- and notes flags it as migrated data. One insert row is generated per
-- individual win/loss so dashboard win-loss records and averages match
-- the spreadsheet totals exactly.
--
-- Run this once in the Supabase SQL editor, after schema.sql,
-- 002_map_size_availability.sql, 003_map_size_data.sql, and
-- 004_allow_null_played_at.sql.

-- Archipelago (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 1), 3, 16, 30, 'win', 3, null, 'Migrated from spreadsheet totals');

-- Damocles (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 2), 3, 16, 30, 'win', null, null, 'Migrated from spreadsheet totals');

-- Greasy Mullet (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 3), 3, 16, 30, 'win', 2, null, 'Migrated from spreadsheet totals');

-- Static (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 5), 3, 16, 30, 'win', 1, null, 'Migrated from spreadsheet totals');

-- Trident (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 8), 3, 16, 30, 'win', 4, null, 'Migrated from spreadsheet totals');

-- Wake Island (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 9), 3, 16, 30, 'win', 1, null, 'Migrated from spreadsheet totals');

-- Daliant Plant (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 11), 3, 16, 30, 'win', 2, null, 'Migrated from spreadsheet totals');

-- Daqing Oilfields (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 12), 3, 16, 30, 'win', 1, null, 'Migrated from spreadsheet totals');

-- Devil's Perch (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 13), 3, 16, 30, 'win', 2, null, 'Migrated from spreadsheet totals');

-- Falklands (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 16), 3, 16, 30, 'win', 3, null, 'Migrated from spreadsheet totals');

-- Ghost Town (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 17), 3, 16, 30, 'loss', 5, null, 'Migrated from spreadsheet totals');

-- Great Wall (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 18), 3, 16, 30, 'win', 3, null, 'Migrated from spreadsheet totals');

-- Road to Jalalabad (3p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 27), 3, 16, 30, 'loss', 5, null, 'Migrated from spreadsheet totals');

-- Archipelago (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 1), 4, 16, 40, 'win', 3, null, 'Migrated from spreadsheet totals');

-- Damocles (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 2), 4, 16, 40, 'win', 4, null, 'Migrated from spreadsheet totals');
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 2), 4, 16, 40, 'loss', 4, null, 'Migrated from spreadsheet totals');

-- Static (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 5), 4, 16, 40, 'win', 1, null, 'Migrated from spreadsheet totals');

-- Surge (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 7), 4, 16, 40, 'win', 5, null, 'Migrated from spreadsheet totals');

-- Trident (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 8), 4, 16, 40, 'win', 3, null, 'Migrated from spreadsheet totals');

-- Wake Island (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 9), 4, 16, 40, 'win', 3, null, 'Migrated from spreadsheet totals');

-- City District (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 10), 4, 16, 40, 'win', 3, null, 'Migrated from spreadsheet totals');

-- Daliant Plant (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 11), 4, 16, 40, 'win', 3, null, 'Migrated from spreadsheet totals');

-- Devil's Perch (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 13), 4, 16, 40, 'win', 2, null, 'Migrated from spreadsheet totals');

-- Ghost Town (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 17), 4, 16, 40, 'win', 2, null, 'Migrated from spreadsheet totals');

-- Day Flight (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 25), 4, 16, 40, 'win', 2, null, 'Migrated from spreadsheet totals');

-- Road to Jalalabad (4p, size 16)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 27), 4, 16, 40, 'loss', null, null, 'Migrated from spreadsheet totals');
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 27), 4, 16, 40, 'loss', null, null, 'Migrated from spreadsheet totals');
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 27), 4, 16, 40, 'loss', null, null, 'Migrated from spreadsheet totals');

-- Karkand Storm (5p, size 64)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 21), 5, 64, 50, 'win', 2, null, 'Migrated from spreadsheet totals');

-- Kubra Dam (6p, size 64)
insert into public.bf2_game_logs (map_id, player_count, map_size, bot_count, result, difficulty, played_at, notes) values ((select id from public.bf2_maps where sort_order = 42), 6, 64, 60, 'win', 2, null, 'Migrated from spreadsheet totals');

