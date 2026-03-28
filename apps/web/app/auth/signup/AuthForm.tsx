'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

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

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: 'var(--ios-label3)',
    letterSpacing: '-0.08px',
    marginBottom: 6,
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Email + Password grouped like iOS */}
        <div className="ios-group">
          <div style={{ padding: '0 16px' }}>
            <label style={{ ...labelStyle, paddingTop: 12, display: 'block' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                background: 'transparent',
                border: 'none',
                borderBottom: '0.5px solid var(--ios-sep)',
                padding: '8px 0 12px',
                width: '100%',
                fontSize: 17,
                letterSpacing: '-0.43px',
                color: 'var(--ios-label)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ padding: '0 16px' }}>
            <label style={{ ...labelStyle, paddingTop: 12, display: 'block' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px 0 12px',
                width: '100%',
                fontSize: 17,
                letterSpacing: '-0.43px',
                color: 'var(--ios-label)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: 10,
              padding: '12px 16px',
              background: 'rgba(255, 69, 58, 0.12)',
              borderRadius: 10,
              border: '1px solid rgba(255, 69, 58, 0.25)',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--ios-red)', letterSpacing: '-0.08px' }}>{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="ios-btn-primary"
          style={{ marginTop: 16, opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </form>
  );
}
