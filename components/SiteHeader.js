import Link from 'next/link';
import { signOut } from '@/app/admin/actions';

export default function SiteHeader({ signedIn = false, email = '', isAdmin = false }) {
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
          {signedIn ? (
            <>
              {isAdmin ? (
                <Link className="button-link header-button header-user" href="/admin" title="Open admin">
                  {email || 'Admin'}
                </Link>
              ) : (
                <span className="header-user-label">{email}</span>
              )}
              <form action={signOut}>
                <button className="button-link header-button" type="submit">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link className="button-link header-button" href="/login">
              Admin login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
