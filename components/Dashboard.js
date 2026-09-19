'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import RankBadge from '@/components/RankBadge';
import CellHover from '@/components/CellHover';
import ProfileModal from '@/components/ProfileModal';
import { rankForPlayer } from '@/lib/ranks';
import { playerHref } from '@/lib/profile';
import { exportCsv, exportExcel } from '@/lib/exportStats';
import { PLAYER_COUNTS, MAP_SIZES, buildStatsIndex, mapSupportsSize } from '@/lib/stats';

const LEADERBOARD_SIZE = 9; // three columns of three

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Compact date for the table cells, e.g. "29 Jun 25"
const shortDay = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${d} ${month} ${String(y).slice(2)}`;
};

const dayLabel = (iso) => {
  if (!iso) return 'date unknown';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

function BotsTip({ summary }) {
  const { topWin, topLoss, latest } = summary;
  const rows = [
    ['Highest at a win', topWin?.bots, null, topWin?.playedAt],
    ['Highest at a loss', topLoss?.bots, null, topLoss?.playedAt],
    ['Most recent', latest?.bots, latest?.result, latest?.playedAt],
  ];
  return (
    <>
      <div className="cell-tip-title">Bots</div>
      {rows.map(([label, bots, result, date]) => (
        <div className="cell-tip-row" key={label}>
          <span>{label}</span>
          <strong>
            {bots ?? '\u2014'}
            {result && <em> {result}</em>}
          </strong>
          <span className="cell-tip-date">{bots == null ? '' : dayLabel(date)}</span>
        </div>
      ))}
    </>
  );
}

function SizeCell({ summary, available, showDates }) {
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
    summary.botsShown != null ? `bots ${summary.botsShown}` : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <td>
      <CellHover tip={<BotsTip summary={summary} />}>
      <div className="cell-swap" data-view={showDates ? 'dates' : 'results'}>
        <div className="cell-inner cell-view cell-view-results" aria-hidden={showDates}>
          <span className="wl-chip">
            <span className={summary.wins > 0 ? 'wl-win' : 'wl-zero'}>{summary.wins}W</span>
            <span className="wl-sep"> / </span>
            <span className={summary.losses > 0 ? 'wl-loss' : 'wl-zero'}>{summary.losses}L</span>
          </span>
          {meta && <span className="cell-meta">{meta}</span>}
        </div>
        <div className="cell-inner cell-view cell-view-dates" aria-hidden={!showDates}>
          <span className="cell-meta">
            Last played:{' '}
            <span className="cell-date-value">
              {summary.lastPlayedAt ? shortDay(summary.lastPlayedAt) : 'date unknown'}
            </span>
          </span>
        </div>
      </div>
      </CellHover>
    </td>
  );
}

function StandingRow({ player, position, onOpen }) {
  const rank = rankForPlayer(player);

  function handleClick(e) {
    // let ctrl/cmd/shift/middle clicks open the full page in a new tab as usual
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    onOpen(player);
  }

  return (
    <div className="standing-row">
      <span className={position <= 3 ? 'standing-pos standing-pos-top' : 'standing-pos'}>{position}</span>
      <RankBadge rank={rank} />
      <span className="standing-who">
        <Link className="standing-name" href={playerHref(player)} onClick={handleClick}>
          {player.name}
        </Link>
        <span className="standing-rank">{rank.name}</span>
      </span>
      <span className="standing-score">{player.score.toLocaleString('en-US')}</span>
    </div>
  );
}

function Standings({ players, onOpen }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(true);

  const ranked = useMemo(() => [...players].sort((a, b) => b.score - a.score), [players]);
  const positions = useMemo(() => new Map(ranked.map((p, i) => [p.id, i + 1])), [ranked]);

  const q = query.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? ranked.filter((p) => p.name.toLowerCase().includes(q)) : []),
    [ranked, q]
  );

  if (ranked.length === 0) return null;

  const searching = q.length > 0;
  const shown = (searching ? matches : ranked).slice(0, LEADERBOARD_SIZE);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && matches.length > 0) {
      e.preventDefault();
      onOpen(matches[0]);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  }

  return (
    <div className="glass standings-panel">
    <div className="section-block">
      <div className="standings">
        <button
          type="button"
          className="bar-header bar-header-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="bar-header-title">
            <span className={`toggle-chevron ${open ? 'toggle-chevron-open' : ''}`} aria-hidden="true">&#9656;</span>
            Player Standings
          </span>
          <span className="bar-header-note">
            {searching ? `${matches.length} of ${ranked.length} players` : 'Score, all rounds'}
          </span>
        </button>

        {open && (
        <>

        <div className="standings-controls">
          <div className="standings-control standings-search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Search ${ranked.length} players`}
              aria-label="Search players"
            />
            {searching && (
              <button className="link-button" type="button" onClick={() => setQuery('')}>
                Clear
              </button>
            )}
          </div>
          <div className="standings-control">
            <Link className="nav-link" href="/players">
              All players &rarr;
            </Link>
          </div>
          <div className="standings-control">
            <Link className="nav-link" href="/ranks">
              Rank guide &rarr;
            </Link>
          </div>
        </div>

        {shown.length > 0 ? (
          <div className="standings-grid">
            {shown.map((player, i) => (
              <StandingRow
                key={player.id}
                player={player}
                position={searching ? positions.get(player.id) : i + 1}
                onOpen={onOpen}
              />
            ))}
          </div>
        ) : (
          <div className="standings-empty">No players match &ldquo;{query.trim()}&rdquo;.</div>
        )}

        {searching && matches.length > LEADERBOARD_SIZE && (
          <div className="standings-empty">
            Showing the top {LEADERBOARD_SIZE} of {matches.length} matches &mdash; keep typing to narrow it down.
          </div>
        )}
        </>
        )}
      </div>
    </div>
    </div>
  );
}

export default function Dashboard({ maps, logs, players }) {
  const [playerCount, setPlayerCount] = useState(PLAYER_COUNTS[0]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const closeProfile = useCallback(() => setSelectedPlayer(null), []);
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

  const [mapQuery, setMapQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDates, setShowDates] = useState(false);
  const filtersActive = mapQuery.trim() !== '' || sizeFilter !== 'all' || statusFilter !== 'all';
  const visibleSizes = sizeFilter === 'all' ? MAP_SIZES : [Number(sizeFilter)];

  const visibleMaps = useMemo(() => {
    const q = mapQuery.trim().toLowerCase();
    return maps.filter((map) => {
      if (q && !map.name.toLowerCase().includes(q)) return false;
      const sizes = visibleSizes.filter((size) => mapSupportsSize(map, size));
      if (sizes.length === 0) return false;
      if (statusFilter === 'all') return true;
      const cells = sizes.map((size) => statsIndex[map.id]?.[playerCount]?.[size]);
      if (statusFilter === 'played') return cells.some((c) => c?.count > 0);
      if (statusFilter === 'unplayed') return cells.some((c) => !c || c.count === 0);
      return cells.some((c) => c?.losses > 0); // 'lost'
    });
  }, [maps, mapQuery, visibleSizes, statusFilter, statsIndex, playerCount]);

  function clearFilters() {
    setMapQuery('');
    setSizeFilter('all');
    setStatusFilter('all');
  }

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
        <Standings players={players} onOpen={setSelectedPlayer} />

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

          <div className="table-section">
            <>
              <div className="map-filters">
                <input
                  type="search"
                  className="map-filter-search"
                  value={mapQuery}
                  onChange={(e) => setMapQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setMapQuery('')}
                  placeholder={`Search ${maps.length} maps`}
                  aria-label="Search maps"
                />
                <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} aria-label="Map size">
                  <option value="all">All sizes</option>
                  {MAP_SIZES.map((size) => (
                    <option key={size} value={size}>Size {size}</option>
                  ))}
                </select>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status">
                  <option value="all">Any status</option>
                  <option value="played">Played</option>
                  <option value="unplayed">Not yet played</option>
                  <option value="lost">Lost at least once</option>
                </select>
                {filtersActive && (
                  <button className="link-button" type="button" onClick={clearFilters}>
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={showDates}
                  className="switch-toggle"
                  onClick={() => setShowDates((v) => !v)}
                >
                  <span className="switch-track">
                    <span className="switch-knob" />
                  </span>
                  Last played
                </button>
                <span className="map-filter-count">
                  {filtersActive ? `${visibleMaps.length} of ${maps.length} maps` : ''}
                </span>
              </div>
              <div className="table-wrap">
                <table className="stats-table map-table">
                  <thead>
                    <tr>
                      <th>Map</th>
                      {visibleSizes.map((size) => (
                        <th key={size}>Size {size}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleMaps.map((map) => (
                      <tr key={map.id}>
                        <td className="map-name">{map.name}</td>
                        {visibleSizes.map((size) => (
                          <SizeCell
                            key={size}
                            available={mapSupportsSize(map, size)}
                            summary={statsIndex[map.id]?.[playerCount]?.[size]}
                            showDates={showDates}
                          />
                        ))}
                      </tr>
                    ))}
                    {visibleMaps.length === 0 && (
                      <tr>
                        <td className="map-empty" colSpan={visibleSizes.length + 1}>
                          No maps match these filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>

            <div className="legend-row">
            <div className="legend">
              <span>W / L &mdash; rounds won and lost</span>
              <span>DIFF &mdash; bot difficulty, 1 to 5</span>
              <span>&mdash; not yet played</span>
              <span>N/A &mdash; size unsupported on this map</span>
            </div>
            <div className="export-actions">
              <button className="export-button" type="button" onClick={() => exportExcel(maps, statsIndex)}>
                Export to Excel
              </button>
              <button className="export-button" type="button" onClick={() => exportCsv(maps, statsIndex)}>
                Export to CSV
              </button>
            </div>
            </div>
          </div>
        </div>
      </main>

      {selectedPlayer && <ProfileModal player={selectedPlayer} onClose={closeProfile} />}
    </>
  );
}
