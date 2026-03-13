import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Create a server-side Supabase client using the service role key.
 * All DB access goes through Server Actions / Route Handlers — no client-side Supabase.
 */
export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
