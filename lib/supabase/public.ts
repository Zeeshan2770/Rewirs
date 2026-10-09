import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Plain, session-less Supabase client for reading PUBLIC data at build time
 * (Server Components in a statically-exported site are rendered once,
 * during `next build`, not per-request). It never touches cookies or
 * localStorage, so it's safe to run in Node during the build.
 *
 * Only query tables/columns that are meant to be public here (published
 * courses/modules/lessons, faqs, site_settings) - RLS still applies, so
 * this key can never read anything the anon role isn't allowed to see.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
