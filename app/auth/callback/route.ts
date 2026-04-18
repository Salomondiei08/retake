/**
 * /auth/callback
 *
 * Supabase redirects here after:
 *   - Google OAuth sign-in
 *   - Password reset email link
 *
 * Exchanges the `code` query param for a session, then redirects to the
 * appropriate destination.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const type = searchParams.get("type"); // "recovery" for password reset

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Password reset flow — redirect to the reset form
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — bounce to login with error flag
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}
