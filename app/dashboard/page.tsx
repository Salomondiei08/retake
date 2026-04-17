"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { IterationCard } from "@/components/IterationCard";
import { PipelineProgress } from "@/components/PipelineProgress";
import {
  Play,
  Square,
  Wand2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import type { IterationResult, PipelineEvent } from "@/lib/types";

const EXAMPLES = [
  "A golden retriever running through a sunflower field at sunset, cinematic slow motion, 4K",
  "Futuristic city skyline at night with flying cars and neon lights, rain reflecting on streets",
  "A barista pouring latte art in a cozy café, close-up, warm lighting, shallow depth of field",
  "Ocean waves crashing on rocky coastline at golden hour, wide cinematic shot",
];

export default function DashboardPage() {
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
      if (!res.ok || !res.body) throw new Error("Pipeline request failed");

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
              if (ev.allIterations) setIterations(ev.allIterations);
            }
            if (ev.type === "error") setError(ev.message ?? "Unknown error");
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError(err.message);
    } finally {
      setRunning(false);
    }
  }, [prompt, running]);

  const stop = () => {
    abortRef.current?.abort();
    setRunning(false);
  };

  const hasDone = events.some((e) => e.type === "done");
  const isEmpty = iterations.length === 0 && !running && events.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <Wand2 className="h-4 w-4 text-green-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Self-Healing Playground</h1>
          <p className="text-xs text-white/40">
            Generate → Evaluate → Repair automatically
          </p>
        </div>
        {bestIteration && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Sparkles className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              Best score: {bestIteration.scores.overall}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel: input */}
        <div className="w-72 shrink-0 border-r border-white/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate..."
                className="min-h-[120px] resize-none text-sm bg-white/3 border-white/10 focus:border-green-500/40 placeholder:text-white/20 font-mono"
                disabled={running}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-white/30">Quick examples</p>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  disabled={running}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-white/6 bg-white/2 hover:bg-white/5 hover:border-white/10 text-white/40 hover:text-white/70 transition-colors disabled:opacity-40 flex items-start gap-2"
                >
                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-white/20" />
                  <span className="line-clamp-2">{ex}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-white/5 space-y-2">
            <Button
              onClick={run}
              disabled={running || !prompt.trim()}
              className="w-full gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold disabled:opacity-40"
            >
              <Play className="h-4 w-4" />
              {running ? "Running pipeline..." : "Generate & Evaluate"}
            </Button>
            {running && (
              <Button
                variant="ghost"
                onClick={stop}
                className="w-full gap-2 text-white/40 hover:text-white/60 hover:bg-white/5"
                size="sm"
              >
                <Square className="h-3.5 w-3.5" />
                Stop
              </Button>
            )}
          </div>
        </div>

        {/* Right panel: results */}
        <div className="flex-1 overflow-y-auto">
          {/* Live progress */}
          {running && events.length > 0 && !hasDone && (
            <div className="mx-6 mt-6 p-4 rounded-xl border border-white/8 bg-white/2">
              <p className="text-xs font-medium text-white/50 mb-3">Pipeline running</p>
              <PipelineProgress events={events} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-6 mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400">Error: {error}</p>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <div className="h-16 w-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mb-4">
                <Wand2 className="h-7 w-7 text-white/20" />
              </div>
              <h3 className="text-sm font-medium text-white/50 mb-2">
                No results yet
              </h3>
              <p className="text-xs text-white/25 max-w-xs leading-relaxed">
                Enter a prompt and hit Generate. SeedTrace will run the
                self-healing pipeline and show each iteration here.
              </p>
            </div>
          )}

          {/* Iteration cards */}
          {iterations.length > 0 && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-white/60">
                  {hasDone ? "Results" : "Results (streaming)"}
                </h2>
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/5 text-white/40 border-white/8"
                >
                  {iterations.length} iteration{iterations.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        </div>
      </div>
    </div>
  );
}
