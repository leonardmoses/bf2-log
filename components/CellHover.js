'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Wraps a table cell's content and shows `tip` in a small floating card on hover or focus.
// The card is rendered in <body> and positioned with fixed coordinates so the table's
// scroll container can't clip it; it flips below when there's no room above.
// `onOpen`, if given, fires on click (the tooltip hides first, since the modal it opens
// covers the same area).
export default function CellHover({ tip, onOpen, children }) {
  const anchor = useRef(null);
  const card = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchor.current || !card.current) return;
    const a = anchor.current.getBoundingClientRect();
    const c = card.current.getBoundingClientRect();
    const margin = 8;
    const width = document.documentElement.clientWidth;
    const left = Math.min(Math.max(a.left + a.width / 2 - c.width / 2, margin), width - c.width - margin);
    const above = a.top - c.height - margin >= 0;
    setPos({ left, top: above ? a.top - c.height - 6 : a.bottom + 6 });
  }, [open]);

  const show = () => setOpen(true);
  const hide = () => {
    setOpen(false);
    setPos(null);
  };

  function handleClick() {
    if (!onOpen) return;
    hide();
    // The click leaves this cell focused, which would normally reopen the tooltip on its
    // own via onFocus. The modal about to open captures "whatever was focused before it"
    // so it can restore focus there when it closes -- if that's still this cell, closing
    // the modal silently refocuses it and the tooltip reappears behind the closed modal.
    // Blurring first means the modal has nothing to restore focus to.
    anchor.current?.blur();
    onOpen();
  }

  function handleKeyDown(e) {
    if (!onOpen) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <div
      ref={anchor}
      className={`cell-hover ${onOpen ? 'cell-hover-clickable' : ''}`}
      tabIndex={0}
      role={onOpen ? 'button' : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={card}
            className="cell-tip"
            role="tooltip"
            style={pos ? { left: pos.left, top: pos.top } : { left: 0, top: 0, visibility: 'hidden' }}
          >
            {tip}
          </div>,
          document.body
        )}
    </div>
  );
}
