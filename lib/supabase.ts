/**
 * Supabase client helpers.
 *
 * createClient()               — browser client for Client Components / auth flows
 * createServerSupabaseClient() — server client for Route Handlers / Server Components
 * createAdminClient()          — service-role client, server-only
 *
 * IMPORTANT: cookies() is imported lazily inside each server function so this
 * module is safe to import in Client Components without triggering the
 * "next/headers is only available in Server Components" error.
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Use in Client Components. */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Use in Server Components, Route Handlers, and Server Actions.
 * Cookies imported lazily — safe to tree-shake in client bundles.
 */
export async function createServerSupabaseClient() {
  // Dynamic import keeps `next/headers` out of the client bundle
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // May fail in Server Components — middleware handles session refresh.
        }
      },
    },
  });
}

/** Admin client using service role key. Never call from the browser. */
export function createAdminClient() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: sb } = require("@supabase/supabase-js");
  return sb(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
