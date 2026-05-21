import { createClient as _createClient, type SupabaseClient } from '@supabase/supabase-js'

// Singleton — one GoTrueClient instance per browser tab.
// @supabase/ssr's cookie adapter has a known bug (github.com/supabase/ssr/issues/55)
// where setItemAsync doesn't reliably persist the PKCE code verifier.
// Using supabase-js directly with localStorage avoids this entirely.
let _instance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (!_instance) {
    _instance = _createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          flowType: 'pkce',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  }
  return _instance
}
