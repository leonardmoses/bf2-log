-- Allow 7 and 8 player sessions (previously 3 to 6). Safe to re-run.
alter table public.bf2_game_logs drop constraint if exists bf2_game_logs_player_count_check;
alter table public.bf2_game_logs
  add constraint bf2_game_logs_player_count_check check (player_count between 3 and 8);
