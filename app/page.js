import { createClient } from '@/lib/supabase/server';
import Dashboard from '@/components/Dashboard';

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: maps, error: mapsError }, { data: logs, error: logsError }] =
    await Promise.all([
      supabase.from('bf2_maps').select('*').order('sort_order'),
      supabase
        .from('bf2_game_logs')
        .select('*')
        .order('played_at', { ascending: false }),
    ]);

  if (mapsError || logsError) {
    return (
      <main className="page">
        <h1>BF2 Map Progression</h1>
        <p className="error">
          Could not load data: {mapsError?.message || logsError?.message}
        </p>
      </main>
    );
  }

  return <Dashboard maps={maps ?? []} logs={logs ?? []} />;
}
