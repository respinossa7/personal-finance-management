import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client using the service role key. Only ever import
 * this from server code (API routes, server components, seed scripts) —
 * never from a "use client" file. Bypasses RLS, which in this demo is
 * already permissive, but keeping the privilege boundary correct matters
 * for the pattern to generalise to a real build.
 */
export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
