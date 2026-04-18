/**
 * Auth helpers — thin wrappers around the Supabase session.
 *
 * getSession()  — returns the current user session (server-side)
 * getUserId()   — returns the authenticated user id, or null
 */

import { createServerSupabaseClient } from "./supabase";

export async function getSession() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id ?? null;
}
