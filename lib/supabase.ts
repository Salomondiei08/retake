/**
 * Supabase client helpers.
 *
 * createClient()             — browser client for Client Components / auth flows
 * createServerSupabaseClient() — server client for Route Handlers / Server Components
 * createAdminClient()        — service-role client, server-only, never expose to browser
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Use in Client Components. */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Use in Server Components, Route Handlers, and Server Actions.
 * Reads/writes cookies so the session is shared across the request.
 */
export async function createServerSupabaseClient() {
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
          // setAll may fail in Server Components — middleware handles session refresh.
        }
      },
    },
  });
}

/** Admin client using service role key. Never call from the browser. */
export function createAdminClient() {
  // Dynamic import avoids bundling the service key into client bundles.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient: sb } = require("@supabase/supabase-js");
  return sb(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
