'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { formatDate, formatDayOnly } from '@/lib/profile';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// The same "highest at a win / highest at a loss / most recent" figures as the desktop
// hover card, but styled for this modal's light panel instead of the dark floating tooltip.
// On touch there is no hover, so this is the only place those figures are ever visible.
function BotsSummary({ summary }) {
  const rows = [
    ['Highest at a win', summary.topWin, null],
    ['Highest at a loss', summary.topLoss, null],
    ['Most recent', summary.latest, summary.latest?.result],
  ];
  return (
    <div className="rounds-summary">
      {rows.map(([label, entry, result]) => (
        <div className="rounds-summary-item" key={label}>
          <div className="rounds-summary-row">
            <span className="rounds-summary-label">{label}</span>
            <span className="rounds-summary-value">
              {entry?.bots != null ? `${entry.bots} bots` : '—'}
              {result && <span className="rounds-summary-result"> &middot; {result}</span>}
            </span>
            <span className="rounds-summary-date">{entry?.bots == null ? '' : formatDayOnly(entry.playedAt)}</span>
          </div>
          {entry?.bots != null && (
            <div className="rounds-summary-players">
              {entry.players?.length ? entry.players.join(', ') : 'Players not recorded'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Lists every individual round behind one map-table cell (same map, size and player count),
// each linking to its own round detail page, plus the same bots summary the desktop hover
// card shows (touch devices have no hover, so this is the only way to see it there). All
// the data is already loaded client-side (it's the logs for this cell), so unlike
// ProfileModal there is nothing to fetch.
export default function RoundsModal({ mapName, size, playerCount, rounds, summary, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-root">
      <div className="modal-scrim" onMouseDown={onClose} aria-hidden="true" />
      <div className="modal-wrap">
        <div
          className="modal-panel rounds-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-label={`${mapName} rounds`}
          tabIndex={-1}
          ref={panelRef}
        >
          <div className="modal-bar">
            <span className="modal-bar-title">
              {mapName} &middot; Size {size} &middot; {playerCount} players
            </span>
            <span className="modal-bar-actions">
              <button className="modal-close" type="button" onClick={onClose} aria-label="Close rounds list">
                &times;
              </button>
            </span>
          </div>

          {summary && <BotsSummary summary={summary} />}

          <div className="rounds-list-title">Every round</div>
          <div className="rounds-list">
            {rounds.map((round) => (
              <Link key={round.id} href={`/rounds/${round.id}`} className="rounds-list-item" onClick={onClose}>
                <span className={round.result === 'win' ? 'badge badge-yes' : 'badge badge-no'}>
                  {round.result}
                </span>
                <span className="rounds-list-date">
                  {round.played_at ? formatDate(round.played_at) : <span className="date-unknown">(unknown date)</span>}
                </span>
                <span className="rounds-list-meta">
                  {round.bot_count != null ? `${round.bot_count} bots` : ''}
                  {round.difficulty != null ? ` · diff ${round.difficulty}` : ''}
                </span>
                <span className="rounds-list-arrow" aria-hidden="true">
                  &rarr;
                </span>
              </Link>
            ))}
            {rounds.length === 0 && <div className="modal-state">No rounds recorded here yet.</div>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
