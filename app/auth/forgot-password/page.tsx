"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="logo-mark" style={{ width: 36, height: 36, fontSize: 15 }}>R</div>
          <div>
            <p style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 16, color: "var(--fg)", letterSpacing: "-0.01em" }}>Retake</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", marginTop: 2 }}>AI Video DevTools</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 space-y-6">
          {sent ? (
            <div className="text-center space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold">Check your email</h1>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                  It expires in 1 hour.
                </p>
              </div>
              <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm text-primary font-semibold hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold">Reset your password</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email and we&apos;ll send a reset link.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Email</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    className="h-11 bg-background border-border focus:border-primary/50 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
                </Button>
              </form>

              <p className="text-sm text-center text-muted-foreground">
                <Link href="/auth/login" className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
