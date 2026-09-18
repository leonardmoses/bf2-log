import { createClient } from '@/lib/supabase/server';
import SiteHeader from '@/components/SiteHeader';
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
      .order('played_at', { ascending: false }),
    supabase.from('bf2_players').select('*').order('score', { ascending: false }),
  ]);

  if (mapsError || logsError) {
    return (
      <>
        <SiteHeader />
        <main className="page page-section">
          <p className="error">
            Could not load data: {mapsError?.message || logsError?.message}
          </p>
        </main>
      </>
    );
  }

  // bf2_players is optional until its migration has been run.
  return <Dashboard maps={maps ?? []} logs={logs ?? []} players={players ?? []} />;
}
