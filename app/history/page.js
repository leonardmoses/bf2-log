import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const revalidate = 0;

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: logs, error } = await supabase
    .from('bf2_game_logs')
    .select('*, bf2_maps(name)')
    .order('played_at', { ascending: false })
    .order('created_at', { ascending: false });

  const actions = (
    <div className="page-actions">
      <Link className="nav-link" href="/">
        &larr; Back to progression
      </Link>
    </div>
  );

  if (error) {
    return (
      <main className="page">
        {actions}
        <p className="error">Could not load history: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="page">
      {actions}
      <div className="table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Map</th>
                <th>Players</th>
                <th>Size</th>
                <th>Bots</th>
                <th>Result</th>
                <th>Difficulty</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((log) => (
                <tr key={log.id}>
                  <td>{log.played_at ?? '—'}</td>
                  <td className="map-name">{log.bf2_maps?.name ?? 'Unknown'}</td>
                  <td>{log.player_count}</td>
                  <td>{log.map_size}</td>
                  <td>{log.bot_count}</td>
                  <td>
                    <span
                      className={
                        log.result === 'win' ? 'badge badge-yes' : 'badge badge-no'
                      }
                    >
                      {log.result}
                    </span>
                  </td>
                  <td>{log.difficulty ?? '—'}</td>
                  <td>{log.notes ?? ''}</td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td colSpan={8} className="empty-row">
                    No sessions logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </main>
  );
}
