import Link from 'next/link';
import AuthForm from './AuthForm';

export default function SignupPage() {
  return (
    <div className="studio-gate">
      <div className="studio-gate-inner">
        <div className="studio-gate-mark" aria-hidden="true">🎵</div>
        <span className="studio-gate-overline">NEW HERE / LISTENING STUDIO</span>
        <h1>Start hearing<br /><em>what others miss.</em></h1>
        <p className="studio-gate-sub">Create an account to save progress and build a sharper ear.</p>

        <AuthForm mode="signup" />

        <p className="studio-gate-link" style={{ marginTop: 22 }}>
          Already have an account?{' '}
          <Link href="/auth/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
