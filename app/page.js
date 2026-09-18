import { createClient } from '@/lib/supabase/server';
import Dashboard from '@/components/Dashboard';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();

  const [
    { data: maps, error: mapsError },
    { data: logs, error: logsError },
    { data: players },
  ] = await Promise.all([
    supabase.from('bf2_maps').select('*').order('sort_order'),
    supabase
      .from('bf2_game_logs')
      .select('*')
      .order('played_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('bf2_players')
      .select('id, external_id, name, score, rank_override, country, rounds, wins, losses, kills, deaths, play_seconds, last_online')
      .order('score', { ascending: false }),
  ]);

  if (mapsError || logsError) {
    return (
      <main className="page page-section">
        <p className="error">
          Could not load data: {mapsError?.message || logsError?.message}
        </p>
      </main>
    );
  }

  // bf2_players is optional until its migration has been run.
  return <Dashboard maps={maps ?? []} logs={logs ?? []} players={players ?? []} />;
}
