-- Historical data migrated from the spreadsheet has no per-session date,
-- only totals. Allow played_at to be left blank (NULL) for those rows.
-- New entries logged going forward through the admin form will still
-- normally include a real date.
--
-- Run this once in the Supabase SQL editor, after schema.sql.

alter table public.bf2_game_logs alter column played_at drop not null;
