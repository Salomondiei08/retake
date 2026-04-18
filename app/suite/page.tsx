"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ScoreCard } from "@/components/ScoreCard";
import { Play, Plus, Trash2, Save, FlaskConical, Zap } from "lucide-react";
import type {
  BenchmarkPrompt,
  PromptResult,
  SuiteBaseline,
  SuiteEvent,
  SuiteRun,
} from "@/lib/types";
import Link from "next/link";

const DEFAULT_PROMPTS: BenchmarkPrompt[] = [
  {
    id: "1",
    label: "Product shot",
    prompt: "A sleek smartphone rotating on a white reflective surface, studio lighting, 4K",
    threshold: 70,
  },
  {
    id: "2",
    label: "Nature scene",
    prompt: "Ocean waves crashing on a rocky coastline at golden hour, cinematic wide shot",
    threshold: 70,
  },
  {
    id: "3",
    label: "Urban motion",
    prompt: "Time-lapse of a busy city intersection at night, light trails from cars, overhead view",
    threshold: 70,
  },
];

function useSuiteStorage() {
  const [prompts, setPrompts] = useState<BenchmarkPrompt[]>(DEFAULT_PROMPTS);
  const [baseline, setBaseline] = useState<SuiteBaseline | null>(null);

  useEffect(() => {
    const savedPrompts = localStorage.getItem("st_prompts");
    const savedBaseline = localStorage.getItem("st_baseline");
    if (savedPrompts) setPrompts(JSON.parse(savedPrompts));
    if (savedBaseline) setBaseline(JSON.parse(savedBaseline));
  }, []);

  const savePrompts = (p: BenchmarkPrompt[]) => {
    setPrompts(p);
    localStorage.setItem("st_prompts", JSON.stringify(p));
  };

  const saveBaseline = (b: SuiteBaseline) => {
    setBaseline(b);
    localStorage.setItem("st_baseline", JSON.stringify(b));
  };

  return { prompts, baseline, savePrompts, saveBaseline };
}

export default function SuitePage() {
  const { prompts, baseline, savePrompts, saveBaseline } = useSuiteStorage();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, PromptResult>>({});
  const [activePromptIds, setActivePromptIds] = useState<Set<string>>(new Set());
  const [run, setRun] = useState<SuiteRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const addPrompt = () => {
    const id = crypto.randomUUID();
    savePrompts([
      ...prompts,
      { id, label: "New prompt", prompt: "", threshold: 70 },
    ]);
    setEditing(id);
  };

  const removePrompt = (id: string) => {
    savePrompts(prompts.filter((p) => p.id !== id));
  };

  const updatePrompt = (id: string, patch: Partial<BenchmarkPrompt>) => {
    savePrompts(prompts.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const saveAsBaseline = () => {
    const newBaseline: SuiteBaseline = {};
    for (const r of Object.values(results)) {
      newBaseline[r.promptId] = r.avgScore;
    }
    saveBaseline(newBaseline);
  };

  const runSuite = useCallback(async () => {
    if (running || prompts.length === 0) return;
    setRunning(true);
    setResults({});
    setRun(null);
    setError(null);
    setActivePromptIds(new Set(prompts.map((p) => p.id)));

    try {
      const res = await fetch("/api/suite/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts, baseline }),
      });

      if (!res.ok || !res.body) throw new Error("Suite request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          const line = chunk.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const ev = JSON.parse(line) as SuiteEvent;

            if (ev.type === "prompt_done" && ev.result) {
              setResults((prev) => ({
                ...prev,
                [ev.result!.promptId]: ev.result!,
              }));
              setActivePromptIds((prev) => {
                const next = new Set(prev);
                next.delete(ev.result!.promptId);
                return next;
              });
            }

            if (ev.type === "done" && ev.run) {
              setRun(ev.run);
            }

            if (ev.type === "error") {
              setError(ev.message ?? "Unknown error");
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setRunning(false);
      setActivePromptIds(new Set());
    }
  }, [running, prompts, baseline]);

  const hasResults = Object.keys(results).length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Retake</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/playground" className="text-muted-foreground hover:text-foreground transition-colors">
            Playground
          </Link>
          <span className="text-primary font-medium">CI Suite</span>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Prompt Regression Suite</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Define benchmark prompts. Run the suite to generate and score videos.
            Compare against baseline to detect quality regressions.
          </p>
        </div>

        {/* Suite status */}
        {run && (
          <Card
            className={`border ${
              run.status === "pass"
                ? "border-green-500/50 bg-green-950/10"
                : "border-red-500/50 bg-red-950/10"
            }`}
          >
            <CardContent className="pt-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Badge
                  variant={run.status === "pass" ? "default" : "destructive"}
                  className="text-sm px-3 py-1"
                >
                  {run.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {run.passed} passed · {run.failed} failed ·{" "}
                  {run.results.length} total
                </span>
              </div>
              {hasResults && (
                <Button variant="outline" size="sm" onClick={saveAsBaseline} className="gap-2">
                  <Save className="h-3.5 w-3.5" />
                  Save as Baseline
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prompt manager */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Benchmark Prompts ({prompts.length})
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addPrompt} disabled={running} className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
              <Button
                size="sm"
                onClick={runSuite}
                disabled={running || prompts.length === 0}
                className="gap-2"
              >
                <Play className="h-3.5 w-3.5" />
                {running ? "Running..." : "Run Suite"}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {prompts.map((bp) => {
              const result = results[bp.id];
              const isActive = activePromptIds.has(bp.id);

              return (
                <Card key={bp.id} className={isActive ? "border-primary/40" : ""}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-2">
                        {editing === bp.id ? (
                          <>
                            <input
                              className="w-full text-sm font-medium bg-transparent border-b border-border focus:outline-none focus:border-primary"
                              value={bp.label}
                              onChange={(e) =>
                                updatePrompt(bp.id, { label: e.target.value })
                              }
                              onBlur={() => setEditing(null)}
                              autoFocus
                            />
                            <Textarea
                              value={bp.prompt}
                              onChange={(e) =>
                                updatePrompt(bp.id, { prompt: e.target.value })
                              }
                              className="text-xs font-mono min-h-[80px] resize-none"
                              placeholder="Video generation prompt..."
                            />
                          </>
                        ) : (
                          <>
                            <button
                              className="text-sm font-medium text-left hover:text-primary transition-colors"
                              onClick={() => setEditing(bp.id)}
                            >
                              {bp.label}
                            </button>
                            <p
                              className="text-xs text-muted-foreground font-mono line-clamp-2 cursor-pointer"
                              onClick={() => setEditing(bp.id)}
                            >
                              {bp.prompt || "Click to edit..."}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive && (
                          <Badge variant="secondary" className="text-xs animate-pulse">
                            Running
                          </Badge>
                        )}
                        {result && (
                          <Badge
                            variant={result.status === "pass" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {result.avgScore} {result.status.toUpperCase()}
                          </Badge>
                        )}
                        {baseline && baseline[bp.id] != null && result?.baselineDelta != null && (
                          <span
                            className={`text-xs font-semibold ${
                              result.baselineDelta >= 0 ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {result.baselineDelta >= 0 ? "+" : ""}
                            {result.baselineDelta}
                          </span>
                        )}
                        <button
                          onClick={() => removePrompt(bp.id)}
                          disabled={running}
                          className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {result && (
                      <>
                        <Separator />
                        <div className="grid gap-4 sm:grid-cols-3">
                          {result.videos.map((url, i) => (
                            <div key={i} className="space-y-2">
                              <video
                                src={url}
                                controls
                                muted
                                className="w-full rounded-md bg-black aspect-video"
                              />
                              <ScoreCard scores={result.scores[i]} />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Threshold: {result.threshold}</span>
                          <span>
                            Avg: <span className="text-foreground font-semibold">{result.avgScore}</span>
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">Error: {error}</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
