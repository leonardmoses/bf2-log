import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import RoundPlayersTable from '@/components/RoundPlayersTable';
import { formatDate, formatDuration } from '@/lib/profile';

export const revalidate = 0;

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: `Round detail | BF2 Log` };
}

export default async function RoundPage({ params }) {
  const { id } = await params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) notFound();

  const supabase = await createClient();

  const { data: round } = await supabase
    .from('bf2_game_logs')
    .select('*, bf2_maps(name, sort_order)')
    .eq('id', id)
    .maybeSingle();

  if (!round) notFound();

  const { data: roundPlayers } = await supabase
    .from('bf2_round_players')
    .select('*, bf2_players(id, external_id, name, country)')
    .eq('log_id', id)
    .order('score', { ascending: false });

  const humans = (roundPlayers ?? []).filter((rp) => rp.is_human);
  const bots = (roundPlayers ?? []).filter((rp) => !rp.is_human);
  const hasRoundData = (roundPlayers ?? []).length > 0;

  const cards = [
    {
      title: 'Result',
      value: round.result === 'win' ? 'Win' : 'Loss',
      unit: '',
      note: `${round.player_count} players`,
    },
    {
      title: 'Duration',
      value: round.duration_seconds != null ? formatDuration(round.duration_seconds) : '—',
      unit: round.duration_seconds != null ? 'h:mm:ss' : '',
      note: round.duration_seconds != null ? 'Total round time' : 'Not recorded for this session',
    },
    {
      title: 'Bots',
      value: round.bot_count ?? '—',
      unit: 'bots',
      note: `Size ${round.map_size}`,
    },
    {
      title: 'Difficulty',
      value: round.difficulty ?? '—',
      unit: round.difficulty != null ? 'of 5' : '',
      note: round.difficulty != null ? '' : 'Not rated',
    },
  ];

  return (
    <main className="page">
      <div className="page-actions">
        <Link className="nav-link" href="/history">
          Session history
        </Link>
        <Link className="nav-link" href="/">
          &larr; Back to progression
        </Link>
      </div>

      <div className="glass round-detail">
        <div className="profile-head">
          <div className="profile-id">
            <div className="profile-name">{round.bf2_maps?.name ?? 'Unknown map'}</div>
            <div className="profile-meta">
              Size {round.map_size} &middot; {round.player_count} players
              {round.played_at ? (
                <> &middot; {formatDate(round.played_at)}</>
              ) : (
                <>
                  {' '}
                  &middot; <span className="date-unknown">(unknown date)</span>
                </>
              )}
            </div>
          </div>
          <span className={round.result === 'win' ? 'badge badge-yes' : 'badge badge-no'}>{round.result}</span>
        </div>

        <div className="summary-grid">
          {cards.map((card) => (
            <div className="summary-card" key={card.title}>
              <div className="bar-title">{card.title}</div>
              <div className="summary-body">
                <div className="summary-figure">
                  <span className="summary-value">{card.value}</span>
                  {card.unit && <span className="summary-unit">{card.unit}</span>}
                </div>
                {card.note && <div className="summary-note">{card.note}</div>}
              </div>
            </div>
          ))}
        </div>

        {round.notes && (
          <div className="round-notes">
            <span className="round-notes-label">Notes</span> {round.notes}
          </div>
        )}

        <div className="section-block">
          <h2 className="profile-table-title">Players</h2>
          <RoundPlayersTable
            rows={humans}
            emptyText={
              hasRoundData
                ? 'No human players recorded for this session.'
                : 'Per-round player results are not available for this session (it predates the stats import, or has no linked stats round).'
            }
          />

          {bots.length > 0 && (
            <details className="round-bots">
              <summary>Show bot performance ({bots.length})</summary>
              <RoundPlayersTable rows={bots} emptyText="" />
            </details>
          )}
        </div>
      </div>
    </main>
  );
}
