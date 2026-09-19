'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import RankBadge from '@/components/RankBadge';
import { rankForPlayer } from '@/lib/ranks';
import { flagEmoji, formatDate, formatHours, formatNumber, playerHref, ratio } from '@/lib/profile';

export default function PlayersRoster({ players, awardCounts }) {
  const [query, setQuery] = useState('');

  const sorted = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((p) => p.name.toLowerCase().includes(q)) : sorted;
  }, [sorted, query]);

  return (
    <div className="glass roster">
      <div className="section-block">
        <div className="standings">
          <div className="bar-header">
            <span className="bar-header-title">Players</span>
            <span className="bar-header-note">
              {shown.length} of {players.length}
            </span>
          </div>
          <div className="roster-search">
            <input
              type="search"
              placeholder="Search players"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search players"
            />
          </div>
          <div className="table-wrap flat">
            <table className="stats-table roster-table">
              <thead>
                <tr>
                  <th className="num">#</th>
                  <th>Player</th>
                  <th className="num">Score</th>
                  <th className="num">K/D</th>
                  <th className="num">W/L</th>
                  <th className="num">Rounds</th>
                  <th className="num">Hours</th>
                  <th className="num">Awards</th>
                  <th>Last battle</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((player) => {
                  const rank = rankForPlayer(player);
                  return (
                    <tr key={player.id}>
                      <td className="num roster-pos">{sorted.indexOf(player) + 1}</td>
                      <td className="roster-player">
                        <Link className="roster-name" href={playerHref(player)}>
                          <RankBadge rank={rank} size={28} />
                          <span className="roster-who">
                            <span className="standing-name">{player.name}</span>
                            <span className="standing-rank">
                              {rank.name}
                              {player.country ? ` · ${flagEmoji(player.country)}` : ''}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="num" data-label="Score">{formatNumber(player.score)}</td>
                      <td className="num" data-label="K/D">{ratio(player.kills, player.deaths)}</td>
                      <td className="num" data-label="W/L">{ratio(player.wins, player.losses)}</td>
                      <td className="num" data-label="Rounds">{formatNumber(player.rounds)}</td>
                      <td className="num" data-label="Hours">{formatHours(player.play_seconds)}</td>
                      <td className="num" data-label="Awards">{awardCounts[player.id] ?? 0}</td>
                      <td className="roster-last" data-label="Last battle">{formatDate(player.last_online)}</td>
                    </tr>
                  );
                })}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-row">
                      No players match &ldquo;{query}&rdquo;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
