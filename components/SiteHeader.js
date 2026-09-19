import Link from 'next/link';
import { signOut } from '@/app/admin/actions';

// Small line icons, shown instead of the words on phones (see .header-icon in globals.css).
const iconProps = {
  className: 'header-icon',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const UserIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const SignInIcon = () => (
  <svg {...iconProps}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
  </svg>
);

const SignOutIcon = () => (
  <svg {...iconProps}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

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
            <div className="brand-title">BF2 Reloaded <span className="brand-title-note"> AIX2 LenMod 1.7</span></div>
            <div className="brand-subtitle">
              Stats Master Log &mdash; wins | losses | bots | difficulty | dates
            </div>
          </div>
        </Link>
        <div className="header-actions">
          {signedIn ? (
            <>
              {isAdmin ? (
                <Link
                  className="button-link header-button header-user"
                  href="/admin"
                  title={`Open admin (${email})`}
                  aria-label={`Open admin (${email})`}
                >
                  <UserIcon />
                  <span className="header-label">{email || 'Admin'}</span>
                </Link>
              ) : (
                <span className="header-user-label" title={email}>
                  <UserIcon />
                  <span className="header-label">{email}</span>
                </span>
              )}
              <form action={signOut}>
                <button className="button-link header-button" type="submit" title="Sign out" aria-label="Sign out">
                  <SignOutIcon />
                  <span className="header-label">Sign out</span>
                </button>
              </form>
            </>
          ) : (
            <Link className="button-link header-button" href="/login" title="Admin login" aria-label="Admin login">
              <SignInIcon />
              <span className="header-label">Admin login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
