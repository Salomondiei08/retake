"use client";

import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/** Inner component — isolated so useSearchParams is inside a Suspense boundary */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError("Invalid email or password");
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError(null);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
      },
    });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-7 space-y-5">
      <div>
        <h1 className="text-xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
      </div>

      {/* Google */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full h-11 rounded-xl border-border font-semibold text-sm gap-2.5"
      >
        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-mono">or</span>
        <div className="flex-1 h-px bg-border" />
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
            disabled={loading || googleLoading}
            className="h-11 bg-background border-border focus:border-primary/50 text-sm"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground/80">Password</label>
            <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading || googleLoading}
              className="h-11 bg-background border-border focus:border-primary/50 text-sm pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || googleLoading || !email || !password}
          className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
        </Button>
      </form>

      <p className="text-sm text-center text-muted-foreground">
        No account yet?{" "}
        <Link href="/auth/register" className="text-primary font-semibold hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
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
        {/* Suspense required because useSearchParams triggers CSR bailout in prod */}
        <Suspense fallback={<div className="rounded-2xl border border-border bg-card p-7 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
