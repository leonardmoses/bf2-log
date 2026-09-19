import { createClient } from '@/lib/supabase/server';
import Dashboard from '@/components/Dashboard';

export const revalidate = 0;

// Names of the human players in each session (log id -> [names]). Empty until the
// bf2_session_players table exists and has been filled by a stats import.
async function loadSessionPlayers(supabase) {
  const byLog = new Map();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from('bf2_session_players')
      .select('log_id, bf2_players(name)')
      .order('log_id')
      .order('player_id')
      .range(from, from + pageSize - 1);
    if (error || !data) break;
    for (const row of data) {
      const name = row.bf2_players?.name?.trim();
      if (!name) continue;
      if (!byLog.has(row.log_id)) byLog.set(row.log_id, []);
      byLog.get(row.log_id).push(name);
    }
    if (data.length < pageSize) break;
  }
  return byLog;
}

export default async function HomePage({ searchParams }) {
  const { players: playersParam } = await searchParams;
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

  const sessionPlayers = await loadSessionPlayers(supabase);
  const logsWithPlayers = (logs ?? []).map((log) => ({
    ...log,
    players: sessionPlayers.get(log.id) ?? null,
  }));

  // bf2_players is optional until its migration has been run.
  return (
    <Dashboard
      maps={maps ?? []}
      logs={logsWithPlayers}
      players={players ?? []}
      initialPlayerCount={Number(playersParam)}
    />
  );
}
