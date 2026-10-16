-- Adds the Refinery map (it was missing from the original spreadsheet data, caught when
-- this week's stats dump turned up a round on it), placed alphabetically between
-- Processing Plant (26) and Road to Jalalabad (27).
--
-- Only one round of it exists anywhere in the stats history, from this week, so it is
-- treated as a new map rather than backfilled from older data. Sizes are left all
-- available because the real ones are not known: correct them with the size checkboxes
-- in admin if Refinery doesn't actually support all three.
--
-- sort_order is a decimal so it can slot in at 26.5 without renumbering every later map
-- (older scripts identify maps by their whole-number sort_order), the same approach used
-- for Delhi River (supabase/015_add_delhi_river.sql). Safe to re-run.
insert into public.bf2_maps (name, sort_order, supports_16, supports_32, supports_64)
select 'Refinery', 26.5, true, true, true
where not exists (select 1 from public.bf2_maps where name = 'Refinery');
