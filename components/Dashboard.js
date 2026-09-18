'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PLAYER_COUNTS, MAP_SIZES, buildStatsIndex, mapSupportsSize } from '@/lib/stats';

function StatusCell({ summary, available }) {
  if (!available) {
    return (
      <td className="cell cell-na">
        <span>n/a</span>
      </td>
    );
  }

  if (!summary || summary.count === 0) {
    return (
      <td className="cell cell-empty">
        <span>&mdash;</span>
      </td>
    );
  }

  return (
    <td className="cell cell-filled">
      <div className="stat-line">
        <span className="stat-chip stat-chip-record">
          <span className={summary.wins > 0 ? 'stat-wins' : 'stat-zero'}>{summary.wins}W</span>
          <span className="stat-sep">&ndash;</span>
          <span className={summary.losses > 0 ? 'stat-losses' : 'stat-zero'}>{summary.losses}L</span>
        </span>
        {summary.avgDifficulty != null && (
          <span className="stat-chip">Difficulty: {summary.avgDifficulty.toFixed(1)}</span>
        )}
        {summary.lastBotCount != null && (
          <span className="stat-chip">Bots: {summary.lastBotCount}</span>
        )}
      </div>
    </td>
  );
}

export default function Dashboard({ maps, logs }) {
  const [playerCount, setPlayerCount] = useState(PLAYER_COUNTS[0]);
  const statsIndex = useMemo(() => buildStatsIndex(logs), [logs]);

  const totalForTab = maps.reduce(
    (sum, map) => sum + MAP_SIZES.filter((size) => mapSupportsSize(map, size)).length,
    0
  );
  const completedForTab = maps.reduce((sum, map) => {
    const forPlayerCount = statsIndex[map.id]?.[playerCount] ?? {};
    return (
      sum +
      MAP_SIZES.filter(
        (size) => mapSupportsSize(map, size) && (forPlayerCount[size]?.count ?? 0) > 0
      ).length
    );
  }, 0);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>BF2 Map Progression</h1>
          <p className="subtitle">
            Tracking battle progression across every map and server size.
          </p>
        </div>
        <Link className="button-link" href="/login">
          Admin login
        </Link>
      </header>

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

      <p className="progress-summary">
        {completedForTab} / {totalForTab} map+size combinations played at{' '}
        {playerCount} players ({defaultBots(playerCount)} bots by convention)
      </p>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: totalForTab ? `${(completedForTab / totalForTab) * 100}%` : '0%',
          }}
        />
      </div>

      <div className="table-wrap">
        <table className="stats-table">
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
                  <StatusCell
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

      <p className="footer-link">
        <Link href="/history">View full session history &rarr;</Link>
      </p>
    </main>
  );
}

function defaultBots(playerCount) {
  return playerCount * 10;
}
