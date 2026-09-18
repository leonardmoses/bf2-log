'use client';

// Wraps an award tile and keeps its hover tooltip fully on screen: it shifts sideways
// to stay inside the container and flips below the tile when there's no room above.
export default function AwardTileFrame({ className, children }) {
  function position(e) {
    const tile = e.currentTarget;
    const tip = tile.querySelector('.award-tip');
    if (!tip) return;

    const modal = tile.closest('.modal-panel');
    const bounds = (modal ?? document.documentElement).getBoundingClientRect();
    const left = modal ? bounds.left : 0;
    const right = modal ? bounds.right : document.documentElement.clientWidth;
    const top = modal ? bounds.top + 56 : 90;

    const rect = tile.getBoundingClientRect();
    const width = tip.offsetWidth || 250;
    const height = tip.offsetHeight || 140;
    const center = rect.left + rect.width / 2;

    let shift = 0;
    if (center - width / 2 < left + 8) shift = left + 8 - (center - width / 2);
    else if (center + width / 2 > right - 8) shift = right - 8 - (center + width / 2);

    tip.style.setProperty('--tip-shift', `${Math.round(shift)}px`);
    tip.dataset.side = rect.top - height < top ? 'below' : 'above';
  }

  return (
    <div className={className} tabIndex={0} onMouseEnter={position} onFocus={position}>
      {children}
    </div>
  );
}
