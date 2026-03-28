import Link from 'next/link';
import AuthForm from './AuthForm';

export default function SignupPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--ios-bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '16.2px',
              background: 'linear-gradient(145deg, #1a1a2e 0%, #0f3460 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 34,
              margin: '0 auto 16px',
              boxShadow: '0 12px 40px rgba(10,132,255,0.25)',
            }}
          >
            🎵
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              color: 'var(--ios-label)',
              marginBottom: 6,
            }}
          >
            Create account
          </h1>
          <p style={{ fontSize: 15, color: 'var(--ios-label3)', letterSpacing: '-0.23px' }}>
            Start your ear training journey
          </p>
        </div>

        <AuthForm mode="signup" />

        <p
          style={{
            textAlign: 'center',
            marginTop: 20,
            fontSize: 15,
            color: 'var(--ios-label3)',
            letterSpacing: '-0.23px',
          }}
        >
          Already have an account?{' '}
          <Link href="/auth/login" style={{ color: 'var(--ios-blue)', textDecoration: 'none', fontWeight: 500 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
