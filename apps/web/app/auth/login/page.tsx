import Link from 'next/link';
import AuthForm from './AuthForm';

export default function LoginPage() {
  return (
    <div className="studio-gate">
      <div className="studio-gate-inner">
        <div className="studio-gate-mark" aria-hidden="true">🎵</div>
        <span className="studio-gate-overline">WELCOME BACK / LISTENING STUDIO</span>
        <h1>Pick up<br /><em>where you left off.</em></h1>
        <p className="studio-gate-sub">Sign in to keep your streaks, stats, and progress in tune.</p>

        <AuthForm mode="login" />

        <p className="studio-gate-link" style={{ marginTop: 22 }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
