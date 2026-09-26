'use client';

/**
 * Route-level error boundary. Falls through to Next's default error page
 * without this — which breaks the studio shell's visual language and offers
 * no recovery path.
 */

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="studio-gate">
      <div className="studio-gate-inner">
        <div className="studio-gate-mark" aria-hidden="true">🎛️</div>
        <span className="studio-gate-overline">SOMETHING SOUNDED OFF</span>
        <h1>That hit a<br /><em>wrong note.</em></h1>
        <p className="studio-gate-sub">
          An unexpected error interrupted the session. Your training data is safe — try picking up where you left off.
        </p>
        <div className="studio-gate-actions" style={{ marginTop: 26 }}>
          <button
            onClick={reset}
            className="ios-btn-primary"
            style={{ borderRadius: 999, letterSpacing: '-.01em', cursor: 'pointer' }}
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="studio-gate-link"
            style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Back to the studio
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre style={{ marginTop: 24, maxWidth: 480, overflow: 'auto', fontSize: 11, color: 'var(--ios-label3)', textAlign: 'left' }}>
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
