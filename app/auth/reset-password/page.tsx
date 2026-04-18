"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 2000);
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
          {done ? (
            <div className="text-center space-y-4 py-2">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-primary" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold">Password updated</h1>
                <p className="text-sm text-muted-foreground mt-2">Redirecting you to the dashboard…</p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold">Set new password</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">New password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      minLength={6}
                      disabled={loading}
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground/80">Confirm password</label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Same password again"
                    required
                    disabled={loading}
                    className="h-11 bg-background border-border focus:border-primary/50 text-sm"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !password || !confirm}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
