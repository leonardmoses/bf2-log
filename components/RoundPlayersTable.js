'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import RankBadge from '@/components/RankBadge';
import { RANKS } from '@/lib/ranks';
import { formatDuration, formatNumber, playerHref, ratio } from '@/lib/profile';

const COLUMNS = [
  { key: 'name', label: 'Player', type: 'text' },
  { key: 'score', label: 'Score', type: 'number' },
  { key: 'kills', label: 'Kills', type: 'number' },
  { key: 'deaths', label: 'Deaths', type: 'number' },
  { key: 'kd', label: 'K/D', type: 'number' },
  { key: 'play_seconds', label: 'Time played', type: 'number' },
];

function rankFor(index) {
  return RANKS[index] ?? RANKS[0];
}

function valueOf(row, key) {
  if (key === 'name') return row.bf2_players?.name ?? '';
  if (key === 'kd') return row.deaths > 0 ? row.kills / row.deaths : row.kills;
  return row[key];
}

// This round's own 1/2/3 by score, gold/silver/bronze with a star -- separate from each
// player's overall military rank (shown alongside it). Fixed to each player once, so it
// stays put even when the table below is re-sorted by another column.
function PositionBadge({ position }) {
  const medal = position <= 3;
  return (
    <span className={`round-pos ${medal ? `round-pos-${position}` : ''}`}>
      <span className="round-pos-star" aria-hidden="true">
        {medal ? '★' : ''}
      </span>
      <span className="round-pos-num">{position}</span>
    </span>
  );
}

export default function RoundPlayersTable({ rows, emptyText }) {
  // Position is each player's placement by score in this round -- computed once here, so
  // re-sorting the table by another column never moves the medals around.
  const withPosition = useMemo(
    () => [...rows].sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, position: i + 1 })),
    [rows]
  );

  const [sort, setSort] = useState({ key: 'score', dir: 'desc' });

  function toggle(key) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }
    );
  }

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort.key);
    const sign = sort.dir === 'asc' ? 1 : -1;
    return [...withPosition].sort((a, b) => {
      const x = valueOf(a, sort.key);
      const y = valueOf(b, sort.key);
      const cmp = col.type === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { sensitivity: 'base' });
      return cmp * sign;
    });
  }, [withPosition, sort]);

  if (rows.length === 0) {
    return <div className="empty-state round-players-empty">{emptyText}</div>;
  }

  return (
    <div className="table-wrap">
      <table className="stats-table round-players-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const active = sort.key === col.key;
              return (
                <th
                  key={col.key}
                  className={col.type === 'number' ? 'num' : ''}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    className={`sort-button ${active ? 'sort-button-active' : ''}`}
                    onClick={() => toggle(col.key)}
                  >
                    {col.label}
                    <span className="sort-arrow" aria-hidden="true">
                      {active ? (sort.dir === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((rp) => {
            const player = rp.bf2_players;
            const rank = rankFor(rp.rank_at_time);
            return (
              <tr key={rp.player_id}>
                <td className="round-player-name">
                  {player ? (
                    <Link href={playerHref(player)} className="roster-name">
                      <PositionBadge position={rp.position} />
                      <RankBadge rank={rank} size={26} />
                      <span className="standing-who">
                        <span className="standing-name">{player.name}</span>
                        <span className="standing-rank">{rank.name}</span>
                      </span>
                    </Link>
                  ) : (
                    <span className="roster-name">
                      <PositionBadge position={rp.position} />
                      <span className="standing-who">
                        <span className="standing-name">Unknown player</span>
                      </span>
                    </span>
                  )}
                </td>
                <td className="num" data-label="Score">
                  {formatNumber(rp.score)}
                </td>
                <td className="num" data-label="Kills">
                  {formatNumber(rp.kills)}
                </td>
                <td className="num" data-label="Deaths">
                  {formatNumber(rp.deaths)}
                </td>
                <td className="num" data-label="K/D">
                  {ratio(rp.kills, rp.deaths)}
                </td>
                <td className="num" data-label="Time played">
                  {formatDuration(rp.play_seconds)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
