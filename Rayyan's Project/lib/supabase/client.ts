"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Browser Supabase client. Session is persisted in localStorage and
 * refreshed automatically by supabase-js - there is no server involved at
 * all, which matches this app being a fully static export. Every table
 * this client touches is still governed by Row Level Security, so this is
 * exactly as secure as a server-mediated client, just simpler to host.
 */
export function createClient() {
  if (browserClient) return browserClient;
  browserClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  );
  return browserClient;
}
