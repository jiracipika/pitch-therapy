// ─── Auth stub for React Native ──────────────────────────────────────────────
// Mirrors the web auth API signature but throws at runtime.
// This stub prevents Metro from following the supabase import chain.

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
}

export async function signUp(_email?: string, _password?: string) {
  throw new Error('Auth is not available in the React Native app.');
}

export async function signIn(_email?: string, _password?: string) {
  throw new Error('Auth is not available in the React Native app.');
}

export async function signOut() {
  throw new Error('Auth is not available in the React Native app.');
}

export async function getSession() {
  throw new Error('Auth is not available in the React Native app.');
}

export async function getUser(): Promise<UserProfile> {
  throw new Error('Auth is not available in the React Native app.');
}
