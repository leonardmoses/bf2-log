-- BF2 Stat Log schema
-- Run this once in the Supabase SQL editor for the "bf2-stat-log" project.

create table if not exists public.bf2_maps (
  id bigint generated always as identity primary key,
  name text not null,
  sort_order integer not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bf2_game_logs (
  id uuid primary key default gen_random_uuid(),
  map_id bigint not null references public.bf2_maps(id) on delete cascade,
  player_count integer not null check (player_count between 3 and 8),
  map_size integer not null check (map_size in (16, 32, 64)),
  bot_count integer not null check (bot_count >= 0),
  result text not null check (result in ('win', 'loss')),
  difficulty integer check (difficulty between 1 and 5),
  notes text,
  played_at date default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists bf2_game_logs_map_id_idx on public.bf2_game_logs (map_id);
create index if not exists bf2_game_logs_lookup_idx on public.bf2_game_logs (player_count, map_size, map_id);

alter table public.bf2_maps enable row level security;
alter table public.bf2_game_logs enable row level security;

-- Anyone (including anonymous visitors) can read the progression data.
create policy "Public read maps" on public.bf2_maps
  for select using (true);

create policy "Public read game logs" on public.bf2_game_logs
  for select using (true);

-- Only logged-in users (i.e. the admin account you create in Authentication)
-- can add/edit/delete. There is no public sign-up flow in the app, so
-- "authenticated" effectively means "admin".
create policy "Admin insert maps" on public.bf2_maps
  for insert to authenticated with check (true);
create policy "Admin update maps" on public.bf2_maps
  for update to authenticated using (true) with check (true);
create policy "Admin delete maps" on public.bf2_maps
  for delete to authenticated using (true);

create policy "Admin insert game logs" on public.bf2_game_logs
  for insert to authenticated with check (true);
create policy "Admin update game logs" on public.bf2_game_logs
  for update to authenticated using (true) with check (true);
create policy "Admin delete game logs" on public.bf2_game_logs
  for delete to authenticated using (true);

-- Seed the map list carried over from the existing spreadsheet.
insert into public.bf2_maps (name, sort_order) values
  ('Archipelago', 1),
  ('Damocles', 2),
  ('Greasy Mullet', 3),
  ('Hammer down', 4),
  ('Static', 5),
  ('Running Man', 6),
  ('Surge', 7),
  ('Trident', 8),
  ('Wake Island', 9),
  ('City District', 10),
  ('Daliant Plant', 11),
  ('Daqing Oilfields', 12),
  ('Devil''s Perch', 13),
  ('Dragon Valley', 14),
  ('Dragon Valley Moon', 15),
  ('Falklands', 16),
  ('Ghost Town', 17),
  ('Great Wall', 18),
  ('Gulf of Oman', 19),
  ('Iron Gator', 20),
  ('Karkand Storm', 21),
  ('La Drang', 22),
  ('Mass Destruction', 23),
  ('Morning Breeze', 24),
  ('Day Flight', 25),
  ('Processing Plant', 26),
  ('Road to Jalalabad', 27),
  ('Midnight Sun', 28),
  ('Op Harvest', 29),
  ('Road Rage', 30),
  ('Smoke Screen', 31),
  ('Highway Tampa', 32),
  ('Sharqi Peninsula', 33),
  ('Push Day', 34),
  ('Airport', 35),
  ('Op Clean Sweep', 36),
  ('Course of the River', 37),
  ('Fushe Pass', 38),
  ('Gazala', 39),
  ('Kandahar River Valley', 40),
  ('Kirkuk Basin', 41),
  ('Kubra Dam', 42),
  ('Oasis revisited', 43),
  ('Op Yellow Dragon', 44),
  ('TNG Road to Jalalabad', 45),
  ('Sands of Sinai', 46),
  ('Street', 47),
  ('The Dam Flood', 48),
  ('TNG Push Day', 49),
  ('Town Strike', 50),
  ('Trident', 51),
  ('Trident Moon', 52),
  ('TNG Wake Island Stormfront', 53),
  ('TNG Wake Island Dawn', 54),
  ('TNG Zatar Wetlands II Twilight', 55),
  ('Urban Decay', 56),
  ('Urban Jungle', 57),
  ('Wake Twilight', 58),
  ('Warlord', 59),
  ('Zatar Wetlands', 60),
  ('Easter Island', 61)
on conflict do nothing;
