'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--ios-bg)' }}
    >
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div
          style={{
            width: 72, height: 72, borderRadius: 20,
            background: 'rgba(10,132,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: 36,
          }}
        >
          🎵
        </div>
        <h1
          style={{
            fontSize: 26, fontWeight: 700, letterSpacing: '-0.4px',
            color: 'var(--ios-label)', marginBottom: 8,
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            fontSize: 15, color: 'var(--ios-label2)', lineHeight: 1.5,
            letterSpacing: '-0.23px', marginBottom: 24,
          }}
        >
          This note doesn't exist yet. Head back to the training ground.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            height: 50, borderRadius: 14, padding: '0 32px',
            background: 'linear-gradient(135deg, #0A84FF 0%, #0055D4 100%)',
            color: '#fff', fontSize: 17, fontWeight: 600,
            boxShadow: '0 4px 14px rgba(10,132,255,0.35)',
            textDecoration: 'none',
          }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
