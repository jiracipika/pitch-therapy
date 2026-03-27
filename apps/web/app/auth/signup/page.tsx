import Link from 'next/link';
import AuthForm from './AuthForm';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="gradient-text text-3xl font-bold" style={{ letterSpacing: '-0.03em' }}>
            Create account
          </h1>
          <p className="mt-2 text-sm text-zinc-500">Start your ear training journey</p>
        </div>

        <AuthForm mode="signup" />

        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-zinc-300 underline-offset-2 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
