import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  displayName: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Storage Keys ────────────────────────────────────────────────────────────

const AUTH_KEY = '@pitch_therapy_auth';

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false,
  });

  // Load persisted session on mount
  useEffect(() => {
    (async () => {
      try {
        // Check for stored session in AsyncStorage-like approach
        // Using localStorage simulation for now (will work with Expo SecureStore in production)
        const stored = globalThis.__pitchTherapyAuth;
        if (stored) {
          setState({ user: stored, loading: false, initialized: true });
          return;
        }
      } catch {
        // Ignore storage errors
      }
      setState({ user: null, loading: false, initialized: true });
    })();
  }, []);

  const persistUser = useCallback((user: User | null) => {
    if (user) {
      globalThis.__pitchTherapyAuth = user;
    } else {
      delete globalThis.__pitchTherapyAuth;
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true }));

    try {
      // Try Supabase auth if configured
      const { getSupabaseClient } = require('@pitch-therapy/core');
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const user: User = {
        id: data.user.id,
        email: data.user.email ?? email,
        displayName: data.user.user_metadata?.display_name ?? null,
      };
      persistUser(user);
      setState({ user, loading: false, initialized: true });
    } catch (supabaseError: any) {
      // Fallback: local auth for dev/offline
      if (supabaseError?.message?.includes('Missing') || supabaseError?.message?.includes('Failed to fetch') || supabaseError?.message?.includes('not available')) {
        const user: User = {
          id: `local_${email.replace(/[^a-z0-9]/gi, '_')}`,
          email,
          displayName: email.split('@')[0] ?? null,
        };
        persistUser(user);
        setState({ user, loading: false, initialized: true });
        return;
      }
      setState((s) => ({ ...s, loading: false }));
      throw supabaseError;
    }
  }, [persistUser]);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    setState((s) => ({ ...s, loading: true }));

    try {
      const { getSupabaseClient } = require('@pitch-therapy/core');
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;

      const user: User = {
        id: data.user?.id ?? `local_${email.replace(/[^a-z0-9]/gi, '_')}`,
        email: data.user?.email ?? email,
        displayName: displayName ?? null,
      };
      persistUser(user);
      setState({ user, loading: false, initialized: true });
    } catch (supabaseError: any) {
      if (supabaseError?.message?.includes('Missing') || supabaseError?.message?.includes('Failed to fetch') || supabaseError?.message?.includes('not available')) {
        const user: User = {
          id: `local_${email.replace(/[^a-z0-9]/gi, '_')}`,
          email,
          displayName: displayName ?? email.split('@')[0] ?? null,
        };
        persistUser(user);
        setState({ user, loading: false, initialized: true });
        return;
      }
      setState((s) => ({ ...s, loading: false }));
      throw supabaseError;
    }
  }, [persistUser]);

  const signOut = useCallback(async () => {
    try {
      const { getSupabaseClient } = require('@pitch-therapy/core');
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // Ignore
    }
    persistUser(null);
    setState({ user: null, loading: false, initialized: true });
  }, [persistUser]);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ─── Global type for auth persistence ────────────────────────────────────────

declare global {
  var __pitchTherapyAuth: User | undefined;
}
