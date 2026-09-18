'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import RankBadge from '@/components/RankBadge';
import { rankForPlayer } from '@/lib/ranks';
import { PLAYER_COUNTS, MAP_SIZES, buildStatsIndex, mapSupportsSize } from '@/lib/stats';

const LEADERBOARD_SIZE = 10;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function SizeCell({ summary, available }) {
  if (!available) {
    return (
      <td>
        <div className="cell-inner">
          <span className="cell-na">N/A</span>
        </div>
      </td>
    );
  }

  if (!summary || summary.count === 0) {
    return (
      <td>
        <div className="cell-inner">
          <span className="cell-unplayed">&mdash;</span>
        </div>
      </td>
    );
  }

  const meta = [
    summary.avgDifficulty != null ? `diff ${summary.avgDifficulty.toFixed(1)}` : null,
    summary.lastBotCount != null ? `bots ${summary.lastBotCount}` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <td>
      <div className="cell-inner">
        <span className="wl-chip">
          <span className={summary.wins > 0 ? 'wl-win' : 'wl-zero'}>{summary.wins}W</span>
          <span className="wl-sep"> / </span>
          <span className={summary.losses > 0 ? 'wl-loss' : 'wl-zero'}>{summary.losses}L</span>
        </span>
        {meta && <span className="cell-meta">{meta}</span>}
      </div>
    </td>
  );
}

function Standings({ players }) {
  const leaders = [...players]
    .sort((a, b) => b.score - a.score)
    .slice(0, LEADERBOARD_SIZE);

  if (leaders.length === 0) return null;

  return (
    <div className="section-block">
      <div className="standings">
        <div className="bar-header">
          <span className="bar-header-title">Player Standings</span>
          <span className="bar-header-note">Score, all rounds</span>
        </div>
        <div className="standings-grid">
          {leaders.map((player, i) => {
            const rank = rankForPlayer(player);
            return (
              <div className="standing-row" key={player.id}>
                <span className={i < 3 ? 'standing-pos standing-pos-top' : 'standing-pos'}>
                  {i + 1}
                </span>
                <RankBadge rank={rank} />
                <span className="standing-who">
                  <span className="standing-name">{player.name}</span>
                  <span className="standing-rank">{rank.name}</span>
                </span>
                <span className="standing-score">{player.score.toLocaleString('en-US')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ maps, logs, players }) {
  const [playerCount, setPlayerCount] = useState(PLAYER_COUNTS[0]);
  const statsIndex = useMemo(() => buildStatsIndex(logs), [logs]);

  const tabLogs = useMemo(
    () => logs.filter((log) => log.player_count === playerCount),
    [logs, playerCount]
  );

  const totalCombos = maps.reduce(
    (sum, map) => sum + MAP_SIZES.filter((size) => mapSupportsSize(map, size)).length,
    0
  );
  const playedCombos = maps.reduce((sum, map) => {
    const forPlayerCount = statsIndex[map.id]?.[playerCount] ?? {};
    return (
      sum +
      MAP_SIZES.filter(
        (size) => mapSupportsSize(map, size) && (forPlayerCount[size]?.count ?? 0) > 0
      ).length
    );
  }, 0);

  const wins = tabLogs.filter((log) => log.result === 'win').length;
  const losses = tabLogs.filter((log) => log.result === 'loss').length;
  const games = wins + losses;
  const rated = tabLogs.filter((log) => log.difficulty != null);
  const avgDifficulty = rated.length
    ? rated.reduce((sum, log) => sum + log.difficulty, 0) / rated.length
    : null;

  const pct = totalCombos ? (playedCombos / totalCombos) * 100 : 0;

  const summary = [
    {
      title: 'Progression',
      value: `${playedCombos}/${totalCombos}`,
      unit: 'combos',
      note: `${pct.toFixed(1)}% of the rotation logged`,
    },
    {
      title: 'Record',
      value: `${wins} – ${losses}`,
      unit: 'W – L',
      note: games
        ? `${Math.round((wins / games) * 100)}% win rate over ${plural(games, 'round')}`
        : 'No rounds played',
    },
    {
      title: 'Avg difficulty',
      value: avgDifficulty != null ? avgDifficulty.toFixed(2) : 'N/A',
      unit: 'of 5.0',
      note: avgDifficulty != null
        ? `Across ${plural(rated.length, 'rated round')}`
        : 'Awaiting first rated round',
    },
  ];

  return (
    <>
      <main className="page">
        <div className="tabs-row">
        <nav className="tabs" aria-label="Player count">
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              className={`tab ${playerCount === count ? 'tab-active' : ''}`}
              onClick={() => setPlayerCount(count)}
              type="button"
            >
              {count} Players
            </button>
          ))}
        </nav>
        <Link className="nav-link" href="/history">
          View full session history &rarr;
        </Link>
        </div>

        <div className="glass">
          <div className="summary-grid">
            {summary.map((card) => (
              <div className="summary-card" key={card.title}>
                <div className="bar-title">{card.title}</div>
                <div className="summary-body">
                  <div className="summary-figure">
                    <span className="summary-value">{card.value}</span>
                    <span className="summary-unit">{card.unit}</span>
                  </div>
                  <div className="summary-note">{card.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="progress">
            <div className="progress-row">
              <div className="progress-label">
                {playedCombos} of {totalCombos} map + size combinations cleared at {playerCount} players
              </div>
              <div className="progress-convention">{playerCount * 10} bots by convention</div>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${Math.max(pct, 0.6).toFixed(1)}%` }} />
            </div>
          </div>

          <Standings players={players} />

          <div className="table-section">
            {tabLogs.length > 0 ? (
              <div className="table-wrap">
                <table className="stats-table map-table">
                  <thead>
                    <tr>
                      <th>Map</th>
                      {MAP_SIZES.map((size) => (
                        <th key={size}>Size {size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {maps.map((map) => (
                      <tr key={map.id}>
                        <td className="map-name">{map.name}</td>
                        {MAP_SIZES.map((size) => (
                          <SizeCell
                            key={size}
                            available={mapSupportsSize(map, size)}
                            summary={statsIndex[map.id]?.[playerCount]?.[size]}
                          />
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-title">No rounds logged</div>
                <div className="empty-note">
                  Nothing recorded at {playerCount} players yet. Rounds appear here as soon as
                  they are logged.
                </div>
              </div>
            )}

            <div className="legend">
              <span>W / L &mdash; rounds won and lost</span>
              <span>DIFF &mdash; bot difficulty, 1 to 5</span>
              <span>&mdash; not yet played</span>
              <span>N/A &mdash; size unsupported on this map</span>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
