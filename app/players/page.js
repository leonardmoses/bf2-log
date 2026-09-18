import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import PlayersRoster from '@/components/PlayersRoster';

export const revalidate = 0;

export const metadata = { title: 'Players | BF2 Log' };

export default async function PlayersPage() {
  const supabase = await createClient();

  const [{ data: players, error }, { data: awards }] = await Promise.all([
    supabase
      .from('bf2_players')
      .select('id, external_id, name, score, rounds, wins, losses, kills, deaths, play_seconds, country, last_online, rank_override')
      .order('score', { ascending: false }),
    supabase.from('bf2_player_awards').select('player_id'),
  ]);

  const awardCounts = {};
  for (const row of awards ?? []) {
    awardCounts[row.player_id] = (awardCounts[row.player_id] ?? 0) + 1;
  }

  return (
    <main className="page">
      <div className="page-actions">
        <Link className="nav-link" href="/ranks">
          Rank guide
        </Link>
        <Link className="nav-link" href="/">
          &larr; Back to progression
        </Link>
      </div>
      {error ? (
        <p className="error">Could not load players: {error.message}</p>
      ) : (
        <PlayersRoster players={players ?? []} awardCounts={awardCounts} />
      )}
    </main>
  );
}
