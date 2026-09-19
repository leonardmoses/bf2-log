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
              <td>{log.played_at ?? <span className="date-unknown">(unknown date)</span>}</td>
              <td className="map-name">{log.bf2_maps?.name ?? 'Unknown'}</td>
              <td>{log.player_count}</td>
              <td>{log.map_size}</td>
              <td>{log.bot_count}</td>
              <td>
                <span className={log.result === 'win' ? 'badge badge-yes' : 'badge badge-no'}>{log.result}</span>
              </td>
              <td>{log.difficulty ?? '—'}</td>
              <td>{log.notes ?? ''}</td>
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
  );
}
