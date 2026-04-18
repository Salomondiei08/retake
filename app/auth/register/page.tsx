"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created but sign-in failed. Please log in.");
        router.push("/auth/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong");
      setLoading(false);
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

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-7 space-y-6">
          <div>
            <h1 className="text-xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Start generating and healing videos
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/25">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                disabled={loading}
                className="h-11 bg-background border-border focus:border-primary/50 text-sm"
              />
            </div>

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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80">Password</label>
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

            <Button
              type="submit"
              disabled={loading || !name || !email || !password}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
