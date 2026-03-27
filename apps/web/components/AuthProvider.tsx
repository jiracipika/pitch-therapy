'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  state: AuthState;
  userId: string | null;
}

const AuthContext = createContext<AuthContextValue>({ state: 'loading', userId: null });

export function useAuth() {
  return useContext(AuthContext);
}

// Paths that don't require auth
const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/'];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // For now, skip auth check if Supabase isn't configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setState('authenticated');
      setUserId('anonymous');
      return;
    }

    // Dynamic import to avoid SSR issues
    import('@supabase/supabase-js').then(({ createClient }) => {
      const supabase = createClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
      );

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUserId(session.user.id);
          setState('authenticated');
        } else {
          setState('unauthenticated');
        }
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUserId(session.user.id);
          setState('authenticated');
        } else if (pathname !== '/auth/login' && pathname !== '/auth/signup') {
          setState('unauthenticated');
        }
      });
    }).catch(() => {
      // Supabase not available, allow through
      setState('authenticated');
      setUserId('anonymous');
    });
  }, [pathname]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (state === 'unauthenticated' && !PUBLIC_PATHS.includes(pathname)) {
      router.replace('/auth/login');
    }
  }, [state, pathname, router]);

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-white" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ state, userId }}>
      {children}
    </AuthContext.Provider>
  );
}
