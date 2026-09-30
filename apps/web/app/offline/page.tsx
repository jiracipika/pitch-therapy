import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="studio-gate">
      <div className="studio-gate-inner">
        <div className="studio-gate-mark" aria-hidden="true">📡</div>
        <span className="studio-gate-overline">NO SIGNAL</span>
        <h1>You&apos;re<br /><em>offline.</em></h1>
        <p className="studio-gate-sub">
        This page hasn&apos;t been cached yet. Reconnect and reload — pages you&apos;ve already visited will keep working offline.
        </p>
        <div className="studio-gate-actions" style={{ marginTop: 26 }}>
          <Link
            href="/dashboard"
            className="ios-btn-primary"
            style={{ borderRadius: 999, textDecoration: 'none', letterSpacing: '-.01em' }}
          >
            Try the studio
          </Link>
        </div>
      </div>
    </div>
  );
}
