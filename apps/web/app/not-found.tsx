import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="studio-gate">
      <div className="studio-gate-inner">
        <div className="studio-gate-mark" aria-hidden="true">🎵</div>
        <span className="studio-gate-overline">ERROR 404 / OFF THE SCALE</span>
        <h1>This note<br /><em>doesn&apos;t exist.</em></h1>
        <p className="studio-gate-sub">The page you&apos;re looking for isn&apos;t part of the studio. Head back to the training ground.</p>
        <div className="studio-gate-actions" style={{ marginTop: 26 }}>
          <Link
            href="/dashboard"
            className="ios-btn-primary"
            style={{ borderRadius: 999, textDecoration: 'none', letterSpacing: '-.01em' }}
          >
            Back to the studio
          </Link>
          <Link
            href="/"
            className="studio-gate-link"
            style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
