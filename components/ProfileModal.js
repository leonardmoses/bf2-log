'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ProfileView from '@/components/ProfileView';
import { createClient } from '@/lib/supabase/client';
import { playerHref } from '@/lib/profile';

const profileCache = new Map();
let catalogPromise = null;

function loadCatalog(supabase) {
  catalogPromise ??= supabase
    .from('bf2_awards')
    .select('*')
    .order('sort_order')
    .then(({ data, error }) => {
      if (error) catalogPromise = null;
      return { catalog: data ?? [], awardsMissing: Boolean(error) };
    });
  return catalogPromise;
}

async function loadProfile(player) {
  if (profileCache.has(player.id)) return profileCache.get(player.id);

  const supabase = createClient();
  const [{ data: full, error }, { data: earned }, awards] = await Promise.all([
    supabase.from('bf2_players').select('*').eq('id', player.id).maybeSingle(),
    supabase.from('bf2_player_awards').select('*').eq('player_id', player.id),
    loadCatalog(supabase),
  ]);
  if (error) throw new Error(error.message);

  const result = { player: full ?? player, earned: earned ?? [], ...awards };
  profileCache.set(player.id, result);
  return result;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export default function ProfileModal({ player, onClose }) {
  const [state, setState] = useState({ status: 'loading' });
  const panelRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    loadProfile(player)
      .then((result) => !cancelled && setState({ status: 'ready', ...result }))
      .catch((err) => !cancelled && setState({ status: 'error', message: err.message }));
    return () => {
      cancelled = true;
    };
  }, [player]);

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
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${player.name} profile`}
        tabIndex={-1}
        ref={panelRef}
      >
        <div className="modal-bar">
          <span className="modal-bar-title">Player profile</span>
          <span className="modal-bar-actions">
            <Link className="modal-link" href={playerHref(player)}>
              Open full page &#8599;
            </Link>
            <button className="modal-close" type="button" onClick={onClose} aria-label="Close profile">
              &times;
            </button>
          </span>
        </div>

        {state.status === 'ready' && (
          <ProfileView
            player={state.player}
            catalog={state.catalog}
            earned={state.earned}
            awardsMissing={state.awardsMissing}
          />
        )}
        {state.status === 'loading' && (
          <div className="modal-state">
            <div className="modal-spinner" aria-hidden="true" />
            Loading {player.name}&hellip;
          </div>
        )}
        {state.status === 'error' && (
          <div className="modal-state">
            <p className="error">Could not load this profile: {state.message}</p>
          </div>
        )}
      </div>
      </div>
    </div>,
    document.body
  );
}
