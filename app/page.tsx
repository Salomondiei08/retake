import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Wand2, FlaskConical, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-4 py-3 flex items-center gap-3">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">SeedTrace</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full space-y-10 text-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 text-primary text-xs font-medium">
              <Zap className="h-3 w-3" />
              Track 3: AI DevTools for Video
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              SeedTrace
            </h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Self-healing video generation. Seedance 2.0 generates. Seed 2.0
              evaluates. The agent repairs and retries automatically.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-left">
            <Card className="border-border hover:border-primary/40 transition-colors">
              <CardContent className="pt-5 space-y-3">
                <Wand2 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Self-Healing Playground</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enter a prompt. Watch the agent generate, evaluate, and
                    auto-repair until quality passes the threshold.
                  </p>
                </div>
                <Link href="/playground">
                  <Button className="gap-2 w-full" size="sm">
                    Open Playground <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-border hover:border-primary/40 transition-colors">
              <CardContent className="pt-5 space-y-3">
                <FlaskConical className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Prompt CI/CD Suite</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define benchmark prompts. Run the suite to detect
                    regressions in video quality over time.
                  </p>
                </div>
                <Link href="/suite">
                  <Button variant="outline" className="gap-2 w-full" size="sm">
                    Open Suite <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Seedance 2.0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Seed 2.0 Vision
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              Seedream 5.0
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              SSE Streaming
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
