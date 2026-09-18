import Link from 'next/link';

export default function SiteHeader({ signedIn = false }) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand" href="/">
          <div className="brand-mark" aria-label="Battlefield 2">
            <span className="brand-word">BATTLEFIELD</span>
            <span className="brand-two">2</span>
          </div>
          <div className="brand-divider" />
          <div className="brand-text">
            <div className="brand-title">Map Progression</div>
            <div className="brand-subtitle">
              Campaign log &mdash; wins, losses, bots and difficulty across every map and server size.
            </div>
          </div>
        </Link>
        <div className="header-actions">
          <Link className="button-link" href={signedIn ? '/admin' : '/login'}>
            {signedIn ? 'Admin' : 'Admin login'}
          </Link>
        </div>
      </div>
    </header>
  );
}
