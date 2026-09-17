-- Adds per-map size availability (some maps only exist at certain sizes,
-- e.g. Hammer Down only exists as a 64-size map). Defaults everything to
-- available; correct the exceptions afterwards from the admin panel.
-- Run this once in the Supabase SQL editor, after supabase/schema.sql.

alter table public.bf2_maps
  add column if not exists supports_16 boolean not null default true,
  add column if not exists supports_32 boolean not null default true,
  add column if not exists supports_64 boolean not null default true;
