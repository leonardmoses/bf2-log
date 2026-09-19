import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import RankBadge from '@/components/RankBadge';
import { RANKS, RANK_REQUIREMENTS, rankForPlayer } from '@/lib/ranks';
import { formatNumber, playerHref } from '@/lib/profile';

export const revalidate = 0;

export const metadata = { title: 'Ranks | BF2 Log' };

const NAME_LIMIT = 6;

function Requirements({ index }) {
  const req = RANK_REQUIREMENTS[index];
  if (!req) return <span className="req-none">Score only</span>;

  return (
    <div className="req">
      {req.special && (
        <div className="req-special">
          <span className="req-label">Competitive</span>
          {req.special}
        </div>
      )}
      {req.hours && (
        <div className="req-line">
          <span className="req-label">Play time</span>
          {formatNumber(req.hours)} hours
        </div>
      )}
      {req.badges && (
        <div className="req-line">
          <span className="req-label">Badges</span>
          <span className="req-chips">
            {req.badges.map((badge) => (
              <span className="req-chip" key={badge}>
                {badge}
              </span>
            ))}
          </span>
        </div>
      )}
      {req.note && <div className="req-note">{req.note}</div>}
    </div>
  );
}

export default async function RanksPage({ searchParams }) {
  const { rank: rankParam } = await searchParams;
  const activeRank = /^\d+$/.test(rankParam ?? '') ? Number(rankParam) : null;

  const supabase = await createClient();
  const { data: players } = await supabase
    .from('bf2_players')
    .select('id, external_id, name, score, rank_override, play_seconds')
    .order('score', { ascending: false });

  const byRank = new Map();
  for (const player of players ?? []) {
    const rank = rankForPlayer(player);
    if (!byRank.has(rank.index)) byRank.set(rank.index, []);
    byRank.get(rank.index).push(player);
  }

  return (
    <main className="page">
      <div className="page-actions">
        <Link className="nav-link" href="/players">
          &larr; All players
        </Link>
        <Link className="nav-link" href="/">
          Back to progression
        </Link>
      </div>

      <div className="glass ranks">
        <div className="ranks-intro">
          <h1>Rank guide</h1>
          <p>
            Every Battlefield 2 rank is unlocked by <strong>total career score</strong>, and your rank
            rises on its own as your score grows. Some ranks ask for more than score: specific
            badges, hours played, or a top spot in a weekly or monthly ranking.
          </p>
          <ul>
            <li>
              <strong>First Sergeant</strong> and <strong>Sergeant Major</strong> need a set of badges
              that you must already hold <em>before</em> you reach the score.
            </li>
            <li>
              <strong>Brigadier General</strong> and <strong>Major General</strong> need Veteran
              badges and a lot of play time on top of the score.
            </li>
            <li>
              <strong>Sergeant Major of the Corps</strong> and <strong>General</strong> are
              competitive: only the top player of the week or month holds them.
            </li>
          </ul>
          <p className="ranks-source">
            Requirements follow the BF2Hub rank list. On this site, ranks that need more than score
            can&apos;t be worked out from the numbers alone, so the admin sets them by hand.
          </p>
        </div>

        <div className="section-block">
          <div className="table-wrap">
            <table className="stats-table rank-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th className="num">Score needed</th>
                  <th>Other requirements</th>
                  <th>On this server</th>
                </tr>
              </thead>
              <tbody>
                {RANKS.map((rank) => {
                  const holders = byRank.get(rank.index) ?? [];
                  return (
                    <tr
                      key={rank.index}
                      id={`rank-${rank.index}`}
                      className={rank.index === activeRank ? 'rank-row rank-row-active' : 'rank-row'}
                    >
                      <td>
                        <div className="rank-cell">
                          <RankBadge rank={rank} size={44} />
                          <span className="rank-cell-text">
                            <span className="rank-cell-name">{rank.name}</span>
                            <span className="rank-cell-abbr">
                              {rank.abbr} &middot; rank {rank.index}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="num rank-score" data-label="Score needed">{formatNumber(rank.score)}</td>
                      <td className="rank-req" data-label="Requirements">
                        <Requirements index={rank.index} />
                      </td>
                      <td className="rank-holders" data-label="On this server">
                        {holders.length === 0 && <span className="req-none">&mdash;</span>}
                        {holders.length > NAME_LIMIT && (
                          <span className="holders-count">{holders.length} players</span>
                        )}
                        {holders.length > 0 && holders.length <= NAME_LIMIT && (
                          <span className="holders-names">
                            {holders.map((p) => (
                              <Link key={p.id} href={playerHref(p)} className="holder-chip">
                                {p.name}
                              </Link>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
