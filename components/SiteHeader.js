export default function SiteHeader({
  title = 'Map Progression',
  subtitle = 'Campaign log — wins, losses, bots and difficulty across every map and server size.',
  children,
}) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <div className="brand">
          <div className="brand-mark" aria-label="Battlefield 2">
            <span className="brand-word">BATTLEFIELD</span>
            <span className="brand-two">2</span>
          </div>
          <div className="brand-divider" />
          <div className="brand-text">
            <div className="brand-title">{title}</div>
            <div className="brand-subtitle">{subtitle}</div>
          </div>
        </div>
        {children && <div className="header-actions">{children}</div>}
      </div>
    </header>
  );
}
