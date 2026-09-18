-- Corrects map size availability in databases where an earlier, incorrect
-- guess was applied (it wrongly marked Size 16 unavailable on 23 maps and
-- Size 32 unavailable on Karkand Storm).
--
-- Source of truth: the CSV exports of the original spreadsheet. Size 16
-- and Size 64 exist for every map; only these 22 maps lack a Size 32.
-- Safe to re-run at any time.

update public.bf2_maps
set supports_16 = true, supports_32 = true, supports_64 = true;

update public.bf2_maps
set supports_32 = false
where sort_order in (4, 6, 15, 20, 22, 26, 32, 34, 37, 39, 40, 41, 42, 43, 44, 45, 46, 49, 50, 51, 52, 61);
