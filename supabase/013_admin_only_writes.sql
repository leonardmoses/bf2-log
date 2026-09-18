-- Only the admin accounts below can change data. Everyone else (including anyone who signs
-- up) can read only. Enforced by the database, so it holds even against direct API calls.
-- Keep the list in sync with ADMIN_EMAILS in lib/admin.js. Safe to re-run.
--
-- An account only counts as admin once its email address is confirmed, so nobody can
-- claim an admin address just by registering it.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
      and lower(u.email) = any (array['qalexeon@gmail.com'])
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- maps
drop policy if exists "Admin insert maps" on public.bf2_maps;
drop policy if exists "Admin update maps" on public.bf2_maps;
drop policy if exists "Admin delete maps" on public.bf2_maps;
create policy "Admin insert maps" on public.bf2_maps for insert to authenticated with check (public.is_admin());
create policy "Admin update maps" on public.bf2_maps for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete maps" on public.bf2_maps for delete to authenticated using (public.is_admin());

-- game logs
drop policy if exists "Admin insert game logs" on public.bf2_game_logs;
drop policy if exists "Admin update game logs" on public.bf2_game_logs;
drop policy if exists "Admin delete game logs" on public.bf2_game_logs;
create policy "Admin insert game logs" on public.bf2_game_logs for insert to authenticated with check (public.is_admin());
create policy "Admin update game logs" on public.bf2_game_logs for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete game logs" on public.bf2_game_logs for delete to authenticated using (public.is_admin());

-- players
drop policy if exists "Admin insert players" on public.bf2_players;
drop policy if exists "Admin update players" on public.bf2_players;
drop policy if exists "Admin delete players" on public.bf2_players;
create policy "Admin insert players" on public.bf2_players for insert to authenticated with check (public.is_admin());
create policy "Admin update players" on public.bf2_players for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin delete players" on public.bf2_players for delete to authenticated using (public.is_admin());

-- awards catalog and earned awards
drop policy if exists "Admin write awards" on public.bf2_awards;
drop policy if exists "Admin write player awards" on public.bf2_player_awards;
create policy "Admin write awards" on public.bf2_awards for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admin write player awards" on public.bf2_player_awards for all to authenticated using (public.is_admin()) with check (public.is_admin());
