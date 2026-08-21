'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
