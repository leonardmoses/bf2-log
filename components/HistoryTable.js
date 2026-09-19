'use client';

import { useMemo, useState } from 'react';

const COLUMNS = [
  { key: 'played_at', label: 'Date', type: 'text' },
  { key: 'map', label: 'Map', type: 'text' },
  { key: 'player_count', label: 'Players', type: 'number' },
  { key: 'map_size', label: 'Size', type: 'number' },
  { key: 'bot_count', label: 'Bots', type: 'number' },
  { key: 'result', label: 'Result', type: 'text' },
  { key: 'difficulty', label: 'Difficulty', type: 'number' },
  { key: 'notes', label: 'Notes', type: 'text' },
];

const valueOf = (log, key) => (key === 'map' ? log.bf2_maps?.name ?? '' : log[key]);
const isEmpty = (v) => v == null || v === '';

export default function HistoryTable({ logs }) {
  // starts as newest first, like before
  const [sort, setSort] = useState({ key: 'played_at', dir: 'desc' });

  function toggle(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  const rows = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sort.key);
    const sign = sort.dir === 'asc' ? 1 : -1;
    return logs
      .map((log, index) => ({ log, index }))
      .sort((a, b) => {
        const x = valueOf(a.log, sort.key);
        const y = valueOf(b.log, sort.key);
        // blanks (unknown date, no difficulty, no notes) always sit at the bottom
        if (isEmpty(x) !== isEmpty(y)) return isEmpty(x) ? 1 : -1;
        let cmp = 0;
        if (!isEmpty(x)) {
          cmp = col.type === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { sensitivity: 'base' });
        }
        return cmp * sign || a.index - b.index;
      })
      .map((r) => r.log);
  }, [logs, sort]);

  return (
    <>
      {/* phones: the column headers are hidden (each session becomes a card), so sorting moves here */}
      <div className="history-sort">
        <label>
          <span>Sort by</span>
          <select value={sort.key} onChange={(e) => setSort((s) => ({ ...s, key: e.target.value }))}>
            {COLUMNS.map((col) => (
              <option key={col.key} value={col.key}>
                {col.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="history-sort-dir"
          onClick={() => setSort((s) => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
          aria-label={sort.dir === 'asc' ? 'Ascending, switch to descending' : 'Descending, switch to ascending'}
        >
          {sort.dir === 'asc' ? '\u25B2 Ascending' : '\u25BC Descending'}
        </button>
      </div>
    <div className="table-wrap">
      <table className="stats-table history-table">
        <thead>
          <tr>
            {COLUMNS.map((col) => {
              const active = sort.key === col.key;
              return (
                <th
                  key={col.key}
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
          {rows.map((log) => (
            <tr key={log.id}>
              <td className="history-date">
                {log.played_at ?? <span className="date-unknown">(unknown date)</span>}
              </td>
              <td className="map-name history-map">{log.bf2_maps?.name ?? 'Unknown'}</td>
              <td data-label="Players">{log.player_count}</td>
              <td data-label="Size">{log.map_size}</td>
              <td data-label="Bots">{log.bot_count}</td>
              <td className="history-result">
                <span className={log.result === 'win' ? 'badge badge-yes' : 'badge badge-no'}>{log.result}</span>
              </td>
              <td data-label="Difficulty">{log.difficulty ?? '—'}</td>
              <td className="history-notes">{log.notes ?? ''}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={COLUMNS.length} className="empty-row">
                No sessions logged yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}
