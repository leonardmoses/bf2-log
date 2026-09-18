-- Map size availability (16/32/64), parsed directly from the CSV exports
-- of all four player-count tabs and cross-checked for consistency across
-- all 61 rows in all 4 files (no discrepancies found).
--
-- Result: Size 16 and Size 64 are available for every single map. Only
-- Size 32 varies -- the maps below do not have a Size 32 version.
-- Everything else keeps the migration 002 default (all sizes available).
--
-- Run this once in the Supabase SQL editor, after 002_map_size_availability.sql.
-- Targets rows by sort_order (map names aren't unique -- "Trident" appears twice).

update public.bf2_maps set supports_32 = false where sort_order = 4;  -- Hammer down
update public.bf2_maps set supports_32 = false where sort_order = 6;  -- Running Man
update public.bf2_maps set supports_32 = false where sort_order = 15; -- Dragon Valley Moon
update public.bf2_maps set supports_32 = false where sort_order = 20; -- Iron Gator
update public.bf2_maps set supports_32 = false where sort_order = 22; -- La Drang
update public.bf2_maps set supports_32 = false where sort_order = 26; -- Processing Plant
update public.bf2_maps set supports_32 = false where sort_order = 32; -- Highway Tampa
update public.bf2_maps set supports_32 = false where sort_order = 34; -- Push Day
update public.bf2_maps set supports_32 = false where sort_order = 37; -- Course of the River
update public.bf2_maps set supports_32 = false where sort_order = 39; -- Gazala
update public.bf2_maps set supports_32 = false where sort_order = 40; -- Kandahar River Valley
update public.bf2_maps set supports_32 = false where sort_order = 41; -- Kirkuk Basin
update public.bf2_maps set supports_32 = false where sort_order = 42; -- Kubra Dam
update public.bf2_maps set supports_32 = false where sort_order = 43; -- Oasis revisited
update public.bf2_maps set supports_32 = false where sort_order = 44; -- Op Yellow Dragon
update public.bf2_maps set supports_32 = false where sort_order = 45; -- TNG Road to Jalalabad
update public.bf2_maps set supports_32 = false where sort_order = 46; -- Sands of Sinai
update public.bf2_maps set supports_32 = false where sort_order = 49; -- TNG Push Day
update public.bf2_maps set supports_32 = false where sort_order = 50; -- Town Strike
update public.bf2_maps set supports_32 = false where sort_order = 51; -- Trident (2nd entry)
update public.bf2_maps set supports_32 = false where sort_order = 52; -- Trident Moon
update public.bf2_maps set supports_32 = false where sort_order = 61; -- Easter Island
