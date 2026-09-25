'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { formatDate } from '@/lib/profile';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

// Lists every individual round behind one map-table cell (same map, size and player count),
// each linking to its own round detail page. All the data is already loaded client-side
// (it's just the logs for this cell), so unlike ProfileModal there is nothing to fetch.
export default function RoundsModal({ mapName, size, playerCount, rounds, onClose }) {
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
