-- Adds the Delhi River map (it was missing from the original spreadsheet data), placed
-- alphabetically between Daqing Oilfields (12) and Devil's Perch (13).
--
-- Delhi River is a big map but the game's files list it as 16, and it has only that one
-- version, so it is recorded as size 16 only (until the core files are renamed for 64).
--
-- sort_order becomes a decimal so it can slot in at 12.5 without renumbering every later
-- map (older scripts identify maps by their whole-number sort_order). Safe to re-run.
alter table public.bf2_maps alter column sort_order type numeric;

insert into public.bf2_maps (name, sort_order, supports_16, supports_32, supports_64)
select 'Delhi River', 12.5, true, false, false
where not exists (select 1 from public.bf2_maps where name = 'Delhi River');

update public.bf2_maps
set sort_order = 12.5, supports_16 = true, supports_32 = false, supports_64 = false
where name = 'Delhi River';
