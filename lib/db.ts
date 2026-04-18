/**
 * Server-side Supabase client factory.
 * Use createServerSupabaseClient() in Route Handlers and Server Components.
 * It threads the user session through cookies so RLS policies are respected.
 */
export { createServerSupabaseClient } from "./supabase";
