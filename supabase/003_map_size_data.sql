-- Map size availability (16/32/64), confirmed with the maintainer.
--   64 only ........ 22 maps (custom/TNG maps that only exist at 64)
--   32 and 64 ...... Falklands, Airport
--   all three ...... every other map
--
-- Idempotent: resets every map to all sizes, then applies the exceptions.
-- Safe to re-run at any time (this replaces earlier versions of this file).
-- Targets rows by sort_order (map names aren't unique -- "Trident" appears twice).

update public.bf2_maps
set supports_16 = true, supports_32 = true, supports_64 = true;

-- 64 only
update public.bf2_maps
set supports_16 = false, supports_32 = false
where sort_order in (
  4,   -- Hammer down
  6,   -- Running Man
  15,  -- Dragon Valley Moon
  20,  -- Iron Gator
  22,  -- La Drang
  26,  -- Processing Plant
  32,  -- Highway Tampa
  34,  -- Push Day
  37,  -- Course of the River
  39,  -- Gazala
  40,  -- Kandahar River Valley
  41,  -- Kirkuk Basin
  42,  -- Kubra Dam
  43,  -- Oasis revisited
  44,  -- Op Yellow Dragon
  45,  -- TNG Road to Jalalabad
  46,  -- Sands of Sinai
  49,  -- TNG Push Day
  50,  -- Town Strike
  51,  -- Trident (2nd entry)
  52,  -- Trident Moon
  61   -- Easter Island
);

-- 32 and 64 only
update public.bf2_maps
set supports_16 = false
where sort_order in (
  16,  -- Falklands
  35   -- Airport
);
