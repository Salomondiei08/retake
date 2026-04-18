"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "@/components/ScoreCard";
import {
  Play, Loader2, Wand2, ChevronRight, Sparkles, CheckCircle2,
  RefreshCw, MessageSquarePlus, Star, Clapperboard, ScanSearch,
  Wrench, Zap, Hand, Square,
} from "lucide-react";
import type { EvaluationResult, IterationResult, PipelineEvent } from "@/lib/types";

const SCORE_THRESHOLD = 75;

const EXAMPLES = [
  "A golden retriever running through a sunflower field at sunset, cinematic slow motion, 4K",
  "Futuristic city skyline at night with flying cars and neon lights, rain reflecting on streets",
  "A barista pouring latte art in a cozy café, close-up, warm lighting, shallow depth of field",
  "Ocean waves crashing on rocky coastline at golden hour, wide cinematic shot",
];

// ── Interactive mode types ──────────────────────────────────

type Phase =
  | { tag: "idle" }
  | { tag: "generating"; prompt: string; iteration: number }
  | { tag: "evaluating"; prompt: string; iteration: number; videoUrl: string }
  | { tag: "evaluated"; prompt: string; iteration: number; videoUrl: string; scores: EvaluationResult; genId?: string }
  | { tag: "healing"; prompt: string; iteration: number }
  | { tag: "done"; bestIteration: IterationResult };

// ── Autonomous mode types ───────────────────────────────────

type AutoPhase =
  | { tag: "idle" }
  | { tag: "running" }
  | { tag: "done"; bestIteration: IterationResult; allIterations: IterationResult[] };

interface AutoStep {
  label: string;
  sub?: string;
  status: "done" | "active" | "pending";
  icon: "generate" | "evaluate" | "heal";
  score?: number;
  videoUrl?: string;
}

// ── Helpers ─────────────────────────────────────────────────

async function saveIteration(generationId: string, iter: IterationResult & { userRemarks?: string; accepted?: boolean }) {
  await fetch(`/api/generations/${generationId}/iterations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      iterationNum: iter.iteration, prompt: iter.prompt, videoUrl: iter.videoUrl,
      scores: iter.scores, healed: iter.healed, userRemarks: iter.userRemarks ?? null, accepted: iter.accepted ?? false,
    }),
  });
}

async function finalizeGeneration(generationId: string, bestScore: number) {
  await fetch(`/api/generations/${generationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "done", bestScore }),
  });
}

// ── Main component ───────────────────────────────────────────

export default function DashboardPage() {
  const [mode, setMode] = useState<"interactive" | "autonomous">("interactive");
  const [prompt, setPrompt] = useState("");
  const [userRemarks, setUserRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Interactive state
  const [phase, setPhase] = useState<Phase>({ tag: "idle" });
  const [iterations, setIterations] = useState<IterationResult[]>([]);

  // Autonomous state
  const [autoPhase, setAutoPhase] = useState<AutoPhase>({ tag: "idle" });
  const [autoSteps, setAutoSteps] = useState<AutoStep[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // ── Interactive handlers ─────────────────────────────────

  const reset = () => {
    setPhase({ tag: "idle" });
    setIterations([]);
    setUserRemarks("");
    setError(null);
    setAutoPhase({ tag: "idle" });
    setAutoSteps([]);
  };

  const runGenerate = useCallback(async (currentPrompt: string, iteration: number, genId?: string) => {
    setError(null);
    setPhase({ tag: "generating", prompt: currentPrompt, iteration });
    try {
      const videoRes = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: currentPrompt }) });
      const videoData = await videoRes.json();
      if (!videoRes.ok) throw new Error(videoData.error ?? "Generation failed");
      const videoUrl: string = videoData.videoUrl;

      setPhase({ tag: "evaluating", prompt: currentPrompt, iteration, videoUrl });

      const evalRes = await fetch("/api/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ videoUrl, prompt: currentPrompt }) });
      const evalData = await evalRes.json();
      if (!evalRes.ok) throw new Error(evalData.error ?? "Evaluation failed");

      setPhase({ tag: "evaluated", prompt: currentPrompt, iteration, videoUrl, scores: evalData, genId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase({ tag: "idle" });
    }
  }, []);

  const handleAccept = useCallback(async () => {
    if (phase.tag !== "evaluated") return;
    const { genId } = phase;
    const iter: IterationResult = { iteration: phase.iteration, prompt: phase.prompt, videoUrl: phase.videoUrl, scores: phase.scores, healed: phase.iteration > 1 };
    const all = [...iterations, iter];
    const best = all.reduce((a, b) => b.scores.overall > a.scores.overall ? b : a);
    setIterations(all);
    setPhase({ tag: "done", bestIteration: best });
    if (genId) {
      saveIteration(genId, { ...iter, accepted: true }).catch(console.error);
      finalizeGeneration(genId, best.scores.overall).catch(console.error);
    }
  }, [phase, iterations]);

  const handleHeal = useCallback(async () => {
    if (phase.tag !== "evaluated") return;
    const { prompt: currentPrompt, iteration, videoUrl, scores, genId } = phase;
    const iter: IterationResult = { iteration, prompt: currentPrompt, videoUrl, scores, healed: iteration > 1 };
    const newIterations = [...iterations, iter];
    setIterations(newIterations);
    if (genId) saveIteration(genId, { ...iter, userRemarks, accepted: false }).catch(console.error);

    if (iteration >= 3) {
      const best = newIterations.reduce((a, b) => b.scores.overall > a.scores.overall ? b : a);
      setPhase({ tag: "done", bestIteration: best });
      if (genId) finalizeGeneration(genId, best.scores.overall).catch(console.error);
      return;
    }

    setPhase({ tag: "healing", prompt: currentPrompt, iteration });
    setError(null);
    try {
      const healRes = await fetch("/api/heal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: currentPrompt, scores, userRemarks }) });
      const healData = await healRes.json();
      if (!healRes.ok) throw new Error(healData.error ?? "Heal failed");
      setUserRemarks("");
      await runGenerate(healData.improvedPrompt, iteration + 1, genId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase({ tag: "idle" });
    }
  }, [phase, iterations, userRemarks, runGenerate]);

  // ── Autonomous handlers ──────────────────────────────────

  const runAutonomous = useCallback(async () => {
    if (!prompt.trim()) return;
    setError(null);
    setAutoPhase({ tag: "running" });
    setAutoSteps([]);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), userRemarks }),
        signal: abortRef.current.signal,
      });
      if (!res.ok || !res.body) throw new Error("Pipeline failed");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      const addStep = (step: AutoStep) => setAutoSteps((prev) => {
        const next = [...prev];
        if (next.length > 0) next[next.length - 1] = { ...next[next.length - 1], status: "done" };
        return [...next, step];
      });
      const markLastDone = (patch?: Partial<AutoStep>) => setAutoSteps((prev) => {
        if (!prev.length) return prev;
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], status: "done", ...patch };
        return next;
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() ?? "";

        for (const chunk of lines) {
          const line = chunk.replace(/^data: /, "").trim();
          if (!line) continue;
          try {
            const ev = JSON.parse(line) as PipelineEvent;

            if (ev.type === "generating" && ev.iteration && ev.iteration > 0) {
              addStep({ label: `Iteration ${ev.iteration} — Generating`, sub: ev.prompt?.slice(0, 80), status: "active", icon: "generate" });
            }
            if (ev.type === "evaluating") {
              markLastDone();
              addStep({ label: `Iteration ${ev.iteration} — Evaluating`, status: "active", icon: "evaluate", videoUrl: ev.videoUrl });
            }
            if (ev.type === "iteration_done" && ev.scores) {
              markLastDone({ score: ev.scores.overall });
            }
            if (ev.type === "healing" && !ev.repairedPrompt) {
              addStep({ label: `Score ${ev.scores?.overall} — Healing prompt`, sub: "Seed 2.0 rewriting based on failures...", status: "active", icon: "heal" });
            }
            if (ev.type === "healing" && ev.repairedPrompt) {
              markLastDone({ sub: `→ "${ev.repairedPrompt.slice(0, 70)}..."` });
            }
            if (ev.type === "done" && ev.bestIteration) {
              markLastDone();
              setAutoPhase({ tag: "done", bestIteration: ev.bestIteration, allIterations: ev.allIterations ?? [] });
            }
            if (ev.type === "error") setError(ev.message ?? "Unknown error");
          } catch { /* skip malformed */ }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      setAutoPhase({ tag: "idle" });
    }
  }, [prompt, userRemarks]);

  const stopAutonomous = () => {
    abortRef.current?.abort();
    setAutoPhase({ tag: "idle" });
  };

  const isIdle = mode === "interactive" ? phase.tag === "idle" : autoPhase.tag === "idle";
  const isDone = mode === "interactive" ? phase.tag === "done" : autoPhase.tag === "done";
  const isWorking = !isIdle && !isDone;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3 flex-wrap">
        <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
          <Wand2 className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold">Self-Healing Playground</h1>
          <p className="text-sm text-muted-foreground">Generate → Evaluate → Repair</p>
        </div>

        {/* Mode toggle */}
        <div className="ml-auto flex items-center gap-1 p-1 rounded-xl bg-secondary border border-border">
          <button
            onClick={() => { reset(); setMode("interactive"); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === "interactive" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Hand className="h-3.5 w-3.5" /> Interactive
          </button>
          <button
            onClick={() => { reset(); setMode("autonomous"); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === "autonomous" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Zap className="h-3.5 w-3.5" /> Autonomous
          </button>
        </div>

        {isDone && mode === "autonomous" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/12 border border-primary/25">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm text-primary font-semibold">
              Best: {(autoPhase as Extract<AutoPhase, { tag: "done" }>).bestIteration.scores.overall}/100
            </span>
          </div>
        )}
        {isDone && mode === "interactive" && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/12 border border-primary/25">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm text-primary font-semibold">
              Best: {(phase as Extract<Phase, { tag: "done" }>).bestIteration.scores.overall}/100
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r border-border flex flex-col">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="space-y-2.5">
              <label className="text-sm font-semibold text-foreground/70">Your prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate..."
                className="min-h-[130px] resize-none text-sm bg-card border-border focus:border-primary/50 placeholder:text-muted-foreground/40 font-mono leading-relaxed"
                disabled={isWorking}
              />
            </div>

            {mode === "autonomous" && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                  <MessageSquarePlus className="h-4 w-4" /> Hints for healer
                  <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  value={userRemarks}
                  onChange={(e) => setUserRemarks(e.target.value)}
                  placeholder="e.g. keep it slow, more vibrant colors..."
                  className="min-h-[70px] resize-none text-sm bg-card border-border focus:border-primary/50 placeholder:text-muted-foreground/30"
                  disabled={isWorking}
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground/50">Quick examples</p>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  disabled={isWorking}
                  className="w-full text-left text-sm px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 flex items-start gap-2.5"
                >
                  <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/40" />
                  <span className="line-clamp-2 leading-snug">{ex}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-2">
            {isIdle && mode === "interactive" && (
              <Button
                onClick={async () => {
                  try {
                    const res = await fetch("/api/generations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) });
                    const data = await res.json();
                    await runGenerate(prompt, 1, res.ok ? data.id : undefined);
                  } catch { await runGenerate(prompt, 1); }
                }}
                disabled={!prompt.trim()}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-11 disabled:opacity-40 rounded-xl"
              >
                <Play className="h-4 w-4" /> Generate &amp; Evaluate
              </Button>
            )}
            {isIdle && mode === "autonomous" && (
              <Button
                onClick={runAutonomous}
                disabled={!prompt.trim()}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-11 disabled:opacity-40 rounded-xl"
              >
                <Zap className="h-4 w-4" /> Run Autonomous
              </Button>
            )}
            {isWorking && mode === "autonomous" && (
              <>
                <div className="h-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" /> Running pipeline...
                </div>
                <Button onClick={stopAutonomous} variant="outline" size="sm" className="w-full gap-2 border-border text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl">
                  <Square className="h-3.5 w-3.5" /> Stop
                </Button>
              </>
            )}
            {isWorking && mode === "interactive" && (
              <div className="h-11 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {phase.tag === "healing" ? "Healing..." : phase.tag === "evaluating" ? "Evaluating..." : "Generating..."}
              </div>
            )}
            {isDone && (
              <Button onClick={reset} variant="outline" className="w-full gap-2 border-border text-foreground/60 hover:text-foreground hover:bg-secondary h-11 rounded-xl">
                <RefreshCw className="h-4 w-4" /> Start Over
              </Button>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="mx-6 mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/8">
              <p className="text-sm font-medium text-destructive">Error: {error}</p>
            </div>
          )}

          {/* ── INTERACTIVE MODE ─────────────────────────── */}
          {mode === "interactive" && (
            <>
              {phase.tag === "idle" && iterations.length === 0 && (
                <EmptyState />
              )}
              {(phase.tag === "generating" || phase.tag === "evaluating" || phase.tag === "healing") && (
                <div className="m-6">
                  <ActivePipelineCard phase={phase as Extract<Phase, { tag: "generating" | "evaluating" | "healing" }>} />
                </div>
              )}
              {iterations.length > 0 && (
                <div className="px-6 pt-6 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">Previous iterations</p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {iterations.map((iter) => <PastIterationCard key={iter.iteration} iter={iter} />)}
                  </div>
                </div>
              )}
              {phase.tag === "evaluated" && (
                <EvaluationPanel
                  phase={phase as Extract<Phase, { tag: "evaluated" }>}
                  iterations={iterations}
                  userRemarks={userRemarks}
                  setUserRemarks={setUserRemarks}
                  onAccept={handleAccept}
                  onHeal={handleHeal}
                />
              )}
              {phase.tag === "done" && (
                <DonePanel bestIteration={(phase as Extract<Phase, { tag: "done" }>).bestIteration} />
              )}
            </>
          )}

          {/* ── AUTONOMOUS MODE ──────────────────────────── */}
          {mode === "autonomous" && (
            <>
              {autoPhase.tag === "idle" && <EmptyState autonomous />}
              {(autoPhase.tag === "running" || autoPhase.tag === "done") && (
                <div className="m-6 space-y-4">
                  <AutonomousProgress steps={autoSteps} running={autoPhase.tag === "running"} />
                  {autoPhase.tag === "done" && (
                    <DonePanel bestIteration={(autoPhase as Extract<AutoPhase, { tag: "done" }>).bestIteration} />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Shared sub-components ────────────────────────────────── */

function EmptyState({ autonomous }: { autonomous?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
      <div className="h-20 w-20 rounded-3xl bg-card border border-border flex items-center justify-center mb-5">
        {autonomous ? <Zap className="h-9 w-9 text-muted-foreground/30" /> : <Clapperboard className="h-9 w-9 text-muted-foreground/30" />}
      </div>
      <h3 className="text-lg font-bold text-foreground/60 mb-2">
        {autonomous ? "Ready to run autonomously" : "Ready when you are"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        {autonomous
          ? "Enter a prompt, optionally add hints, and hit Run. Seed 2.0 will generate, score, and heal automatically until the quality threshold is met — no input needed."
          : "Enter a prompt and hit Generate. Retake will produce the video, score it, then pause so you can review and decide what happens next."}
      </p>
    </div>
  );
}

const PHASE_CONFIG = {
  generating: { icon: Clapperboard, color: "text-primary", bg: "bg-primary/10", border: "border-primary/25", label: (i: number) => `Generating iteration ${i} with Seedance 2.0`, sub: "Submitting job and waiting for render" },
  evaluating: { icon: ScanSearch, color: "text-accent", bg: "bg-accent/10", border: "border-accent/25", label: (i: number) => `Evaluating iteration ${i} with Seed 2.0`, sub: "Scoring prompt adherence, temporal consistency, physical logic" },
  healing: { icon: Wrench, color: "text-primary", bg: "bg-primary/10", border: "border-primary/25", label: (i: number) => `Rewriting prompt after iteration ${i}`, sub: "Seed 2.0 incorporating failures and your remarks" },
} as const;

function ActivePipelineCard({ phase }: { phase: Extract<Phase, { tag: "generating" | "evaluating" | "healing" }> }) {
  const cfg = PHASE_CONFIG[phase.tag];
  const Icon = cfg.icon;
  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6`}>
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
          <Icon className={`h-6 w-6 ${cfg.color}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className={`h-4 w-4 animate-spin ${cfg.color} shrink-0`} />
            <h3 className="text-base font-bold">{cfg.label(phase.iteration)}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{cfg.sub}</p>
        </div>
      </div>
      {"prompt" in phase && phase.prompt && (
        <div className="mt-5 p-4 rounded-xl bg-background/40 border border-border">
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">Prompt in use</p>
          <p className="text-sm font-mono text-foreground/80 leading-relaxed">{phase.prompt}</p>
        </div>
      )}
    </div>
  );
}

function PastIterationCard({ iter }: { iter: IterationResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-sm font-bold text-muted-foreground">#{iter.iteration}</span>
        {iter.healed && <Badge className="text-xs h-5 px-2 bg-accent/15 text-accent border-accent/25">Healed</Badge>}
        <span className="ml-auto text-sm font-bold font-mono text-muted-foreground/70">{iter.scores.overall}/100</span>
      </div>
      <video src={iter.videoUrl} controls muted className="w-full bg-black aspect-video" />
    </div>
  );
}

function EvaluationPanel({
  phase, iterations, userRemarks, setUserRemarks, onAccept, onHeal,
}: {
  phase: Extract<Phase, { tag: "evaluated" }>;
  iterations: IterationResult[];
  userRemarks: string;
  setUserRemarks: (v: string) => void;
  onAccept: () => void;
  onHeal: () => void;
}) {
  const isLastIteration = phase.iteration >= 3;
  const prevScore = iterations.length > 0 ? iterations[iterations.length - 1].scores.overall : null;
  const delta = prevScore !== null ? phase.scores.overall - prevScore : null;
  const passed = phase.scores.overall >= SCORE_THRESHOLD;

  return (
    <div className="mx-6 mt-6 mb-6">
      <div className={`rounded-2xl border overflow-hidden ${passed ? "border-primary/30 bg-primary/5" : "border-accent/20 bg-accent/5"}`}>
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <CheckCircle2 className={`h-5 w-5 shrink-0 ${passed ? "text-primary" : "text-accent"}`} />
              <span className="text-base font-bold">Iteration {phase.iteration} complete — your turn</span>
              {delta !== null && (
                <Badge className={`text-xs font-mono font-bold ${delta >= 0 ? "bg-primary/15 text-primary border-primary/25" : "bg-destructive/15 text-destructive border-destructive/25"}`}>
                  {delta >= 0 ? "+" : ""}{delta} pts
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {passed ? `Score ${phase.scores.overall} clears the ${SCORE_THRESHOLD} threshold. Accept or keep polishing.` : `Score ${phase.scores.overall} is below ${SCORE_THRESHOLD}. Review issues, add remarks, then heal or accept anyway.`}
            </p>
          </div>
          <Badge className={`shrink-0 text-sm font-bold px-3 py-1 ${passed ? "bg-primary/15 text-primary border-primary/30" : "bg-accent/15 text-accent border-accent/25"}`}>
            {passed ? "Passed ✓" : "Below threshold"}
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <div>
            <video src={phase.videoUrl} controls muted autoPlay loop className="w-full bg-black aspect-video" />
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">{phase.prompt}</p>
            </div>
          </div>
          <div className="p-5 flex flex-col gap-5">
            <ScoreCard scores={phase.scores} />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <MessageSquarePlus className="h-4 w-4" /> Your remarks <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={userRemarks}
                onChange={(e) => setUserRemarks(e.target.value)}
                placeholder="Colors off, motion too fast, wrong subject... Seed 2.0 will use this when healing."
                className="min-h-[90px] resize-none text-sm bg-background/50 border-border focus:border-primary/40 placeholder:text-muted-foreground/30 leading-relaxed"
              />
            </div>
            <div className="flex flex-col gap-2.5">
              <Button onClick={onAccept} className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl">
                <CheckCircle2 className="h-4 w-4" /> Accept this video
              </Button>
              {!isLastIteration ? (
                <Button onClick={onHeal} variant="outline" className="w-full gap-2 border-border text-foreground/60 hover:text-foreground hover:bg-secondary h-11 rounded-xl">
                  <Wand2 className="h-4 w-4" /> Heal &amp; retry — iteration {phase.iteration + 1} of 3
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground/40 py-1">Max 3 iterations reached</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DonePanel({ bestIteration }: { bestIteration: IterationResult }) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Star className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-base font-bold">Best result — iteration #{bestIteration.iteration}</p>
          <p className="text-sm text-muted-foreground">Highest score across all iterations</p>
        </div>
        <Badge className="ml-auto bg-primary/15 text-primary border-primary/25 text-sm font-bold px-3 py-1">{bestIteration.scores.overall}/100</Badge>
      </div>
      <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
        <div>
          <video src={bestIteration.videoUrl} controls muted className="w-full bg-black aspect-video" />
          <div className="px-4 py-3">
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">{bestIteration.prompt}</p>
          </div>
        </div>
        <div className="p-5"><ScoreCard scores={bestIteration.scores} /></div>
      </div>
    </div>
  );
}

const STEP_ICONS = { generate: Clapperboard, evaluate: ScanSearch, heal: Wand2 };

function AutonomousProgress({ steps, running }: { steps: AutoStep[]; running: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        {running && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        <p className="text-sm font-bold">{running ? "Pipeline running autonomously..." : "Pipeline complete"}</p>
      </div>
      {steps.length === 0 && running && (
        <p className="text-sm text-muted-foreground">Starting up...</p>
      )}
      {steps.map((step, i) => {
        const Icon = STEP_ICONS[step.icon];
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {step.status === "active"
                ? <Loader2 className="h-4 w-4 text-primary animate-spin" />
                : step.status === "done"
                ? <CheckCircle2 className="h-4 w-4 text-primary" />
                : <div className="h-4 w-4 rounded-full border border-border" />}
            </div>
            <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${step.status === "done" ? "text-primary/60" : step.status === "active" ? "text-foreground/60" : "text-muted-foreground/30"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${step.status === "done" ? "text-foreground/70" : step.status === "active" ? "text-foreground" : "text-muted-foreground/40"}`}>
                  {step.label}
                </span>
                {step.score != null && (
                  <Badge className={`text-xs font-mono ${step.score >= 75 ? "bg-primary/15 text-primary border-primary/25" : "bg-accent/15 text-accent border-accent/25"}`}>
                    {step.score}/100
                  </Badge>
                )}
              </div>
              {step.sub && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 font-mono">{step.sub}</p>}
              {step.videoUrl && step.status === "done" && (
                <video src={step.videoUrl} controls muted className="mt-2 w-48 rounded-lg border border-border bg-black aspect-video" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
