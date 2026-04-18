"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { IterationCard } from "@/components/IterationCard";
import { PipelineProgress } from "@/components/PipelineProgress";
import { Play, Zap } from "lucide-react";
import type { IterationResult, PipelineEvent } from "@/lib/types";
import Link from "next/link";

const EXAMPLE_PROMPTS = [
  "A golden retriever running through a field of sunflowers at sunset, cinematic 4K",
  "A futuristic city skyline at night with flying cars and neon lights, rain reflecting on streets",
  "A chef preparing sushi in a modern kitchen, close-up shots, studio lighting",
];

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const [iterations, setIterations] = useState<IterationResult[]>([]);
  const [bestIteration, setBestIteration] = useState<IterationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(async () => {
    if (!prompt.trim() || running) return;

    setRunning(true);
    setEvents([]);
    setIterations([]);
    setBestIteration(null);
    setError(null);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error("Pipeline request failed");
      }

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
            const ev = JSON.parse(line) as PipelineEvent;
            setEvents((prev) => [...prev, ev]);

            if (ev.type === "iteration_done" && ev.videoUrl && ev.scores) {
              const iter: IterationResult = {
                iteration: ev.iteration ?? 0,
                prompt: ev.prompt ?? prompt,
                videoUrl: ev.videoUrl,
                scores: ev.scores,
                healed: (ev.iteration ?? 1) > 1,
              };
              setIterations((prev) => [...prev, iter]);
            }

            if (ev.type === "done" && ev.bestIteration) {
              setBestIteration(ev.bestIteration);
              if (ev.allIterations) {
                setIterations(ev.allIterations);
              }
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
      if (err instanceof Error && err.name !== "AbortError") {
        setError(err.message);
      }
    } finally {
      setRunning(false);
    }
  }, [prompt, running]);

  const stop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const hasDoneEvent = events.some((e) => e.type === "done");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm">Retake</span>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <span className="text-primary font-medium">Playground</span>
          <Link href="/suite" className="text-muted-foreground hover:text-foreground transition-colors">
            CI Suite
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Self-Healing Video Playground</h1>
          <p className="text-muted-foreground text-sm">
            Enter a prompt. Seedance 2.0 generates the video. Seed 2.0 evaluates quality.
            If it fails the threshold, the agent repairs the prompt and tries again.
          </p>
        </div>

        {/* Input */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to generate..."
              className="min-h-[100px] resize-none font-mono text-sm"
              disabled={running}
            />

            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(p)}
                  disabled={running}
                  className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
                >
                  Example {i + 1}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={run}
                disabled={running || !prompt.trim()}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                {running ? "Running..." : "Generate & Evaluate"}
              </Button>
              {running && (
                <Button variant="outline" onClick={stop}>
                  Stop
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        {events.length > 0 && !hasDoneEvent && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pipeline Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PipelineProgress events={events} />
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-destructive text-sm">Error: {error}</p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {iterations.length > 0 && (
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {hasDoneEvent ? "Results" : "Results (in progress)"}
              </h2>
              {bestIteration && (
                <span className="text-sm text-muted-foreground">
                  Best score:{" "}
                  <span className="text-green-400 font-semibold">
                    {bestIteration.scores.overall}
                  </span>
                </span>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {iterations.map((iter, idx) => (
                <IterationCard
                  key={iter.iteration}
                  result={iter}
                  prevScore={idx > 0 ? iterations[idx - 1].scores.overall : undefined}
                  isBest={bestIteration?.iteration === iter.iteration}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
