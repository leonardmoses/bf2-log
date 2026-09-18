'use client';

import { useEffect, useRef, useState } from 'react';

const GLYPH = { Medals: '●', Ribbons: '▬', Badges: '◆', 'Other Badges': '◆' };

// Shows the icon from public/images/awards, falling back to a placeholder tile
// when the file hasn't been added yet.
export default function AwardIcon({ sources, category, name, dim = false }) {
  const [index, setIndex] = useState(0);
  const ref = useRef(null);
  const exhausted = index >= sources.length;

  // Images that failed before hydration never fire onError, so check once mounted.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setIndex((i) => i + 1);
    }
  }, [index]);

  if (exhausted) {
    return (
      <span className={`award-icon award-placeholder ${dim ? 'award-dim' : ''}`} title={name} aria-label={name}>
        {GLYPH[category] ?? '●'}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      className={`award-icon ${dim ? 'award-dim' : ''}`}
      src={sources[index]}
      alt={name}
      loading="lazy"
      onError={() => setIndex((i) => i + 1)}
    />
  );
}
