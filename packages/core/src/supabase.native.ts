// ─── Supabase stub for React Native (Android) ────────────────────────────────
// The mobile app doesn't use Supabase directly — all auth/data goes through
// the web app. This stub prevents Metro from bundling @supabase/supabase-js
// (which pulls in Node.js `ws` module and crashes the Android bundle).

export function getSupabaseClient(): never {
  throw new Error('Supabase is not available in the React Native app.');
}
