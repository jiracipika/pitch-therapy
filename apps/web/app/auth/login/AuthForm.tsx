'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
      );

      if (mode === 'login') {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signUp({ email, password });
        if (authError) throw authError;
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // The rest of the app treats unconfigured Supabase as a valid anonymous
  // session — say so plainly instead of surfacing "supabaseUrl is required."
  if (!supabaseConfigured) {
    return (
      <div className="studio-gate-form">
        <p style={{ color: 'var(--ios-label2)', fontSize: 14, lineHeight: 1.5, margin: '0 0 18px' }}>
          Sign-in isn&apos;t configured on this deployment. Your progress is saved on this device — no account needed.
        </p>
        <Link
          href="/dashboard"
          className="ios-btn-primary"
          style={{ borderRadius: 999, textDecoration: 'none', letterSpacing: '-.01em', display: 'inline-block' }}
        >
          Continue to the studio
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="studio-gate-form">
      <div className="studio-field">
        <label htmlFor={`email-${mode}`}>EMAIL</label>
        <input
          id={`email-${mode}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>

      <div className="studio-field">
        <label htmlFor={`password-${mode}`}>PASSWORD</label>
        <input
          id={`password-${mode}`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="••••••••"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
        />
      </div>

      {error && <div className="studio-gate-error" role="alert">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="ios-btn-primary"
        style={{ marginTop: 8, borderRadius: 999, opacity: loading ? 0.6 : 1, letterSpacing: '-.01em' }}
      >
        {loading ? 'Please wait…' : mode === 'login' ? 'Sign in to the studio' : 'Create account'}
      </button>
    </form>
  );
}
