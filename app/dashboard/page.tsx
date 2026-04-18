"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "@/components/ScoreCard";
import {
  Play,
  Loader2,
  Wand2,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  MessageSquarePlus,
  Star,
  Clapperboard,
  ScanSearch,
  Wrench,
} from "lucide-react";
import type { EvaluationResult, IterationResult } from "@/lib/types";

const SCORE_THRESHOLD = 75;

const EXAMPLES = [
  "A golden retriever running through a sunflower field at sunset, cinematic slow motion, 4K",
  "Futuristic city skyline at night with flying cars and neon lights, rain reflecting on streets",
  "A barista pouring latte art in a cozy café, close-up, warm lighting, shallow depth of field",
  "Ocean waves crashing on rocky coastline at golden hour, wide cinematic shot",
];

type Phase =
  | { tag: "idle" }
  | { tag: "generating"; prompt: string; iteration: number }
  | { tag: "evaluating"; prompt: string; iteration: number; videoUrl: string }
  | {
      tag: "evaluated";
      prompt: string;
      iteration: number;
      videoUrl: string;
      scores: EvaluationResult;
      genId?: string;
    }
  | { tag: "healing"; prompt: string; iteration: number }
  | { tag: "done"; bestIteration: IterationResult };

async function saveIteration(
  generationId: string,
  iter: IterationResult & { userRemarks?: string; accepted?: boolean }
) {
  await fetch(`/api/generations/${generationId}/iterations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      iterationNum: iter.iteration,
      prompt: iter.prompt,
      videoUrl: iter.videoUrl,
      scores: iter.scores,
      healed: iter.healed,
      userRemarks: iter.userRemarks ?? null,
      accepted: iter.accepted ?? false,
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

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>({ tag: "idle" });
  const [iterations, setIterations] = useState<IterationResult[]>([]);
  const [userRemarks, setUserRemarks] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPhase({ tag: "idle" });
    setIterations([]);
    setUserRemarks("");
    setError(null);
  };

  const runGenerate = useCallback(async (currentPrompt: string, iteration: number, genId?: string) => {
    setError(null);
    setPhase({ tag: "generating", prompt: currentPrompt, iteration });

    try {
      const videoRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt }),
      });
      const videoData = await videoRes.json();
      if (!videoRes.ok) throw new Error(videoData.error ?? "Generation failed");
      const videoUrl: string = videoData.videoUrl;

      setPhase({ tag: "evaluating", prompt: currentPrompt, iteration, videoUrl });

      const evalRes = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl, prompt: currentPrompt }),
      });
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
    const iter: IterationResult = {
      iteration: phase.iteration,
      prompt: phase.prompt,
      videoUrl: phase.videoUrl,
      scores: phase.scores,
      healed: phase.iteration > 1,
    };
    const all = [...iterations, iter];
    const best = all.reduce((a, b) => (b.scores.overall > a.scores.overall ? b : a));
    setIterations(all);
    setPhase({ tag: "done", bestIteration: best });

    // Persist to DB (fire-and-forget)
    if (genId) {
      saveIteration(genId, { ...iter, accepted: true }).catch(console.error);
      finalizeGeneration(genId, best.scores.overall).catch(console.error);
    }
  }, [phase, iterations]);

  const handleHeal = useCallback(async () => {
    if (phase.tag !== "evaluated") return;
    const { prompt: currentPrompt, iteration, videoUrl, scores, genId } = phase;

    const iter: IterationResult = {
      iteration,
      prompt: currentPrompt,
      videoUrl,
      scores,
      healed: iteration > 1,
    };
    const newIterations = [...iterations, iter];
    setIterations(newIterations);

    // Save this iteration to DB before healing
    if (genId) {
      saveIteration(genId, { ...iter, userRemarks, accepted: false }).catch(console.error);
    }

    if (iteration >= 3) {
      const best = newIterations.reduce((a, b) => (b.scores.overall > a.scores.overall ? b : a));
      setPhase({ tag: "done", bestIteration: best });
      if (genId) finalizeGeneration(genId, best.scores.overall).catch(console.error);
      return;
    }

    setPhase({ tag: "healing", prompt: currentPrompt, iteration });
    setError(null);

    try {
      const healRes = await fetch("/api/heal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: currentPrompt, scores, userRemarks }),
      });
      const healData = await healRes.json();
      if (!healRes.ok) throw new Error(healData.error ?? "Heal failed");

      setUserRemarks("");
      await runGenerate(healData.improvedPrompt, iteration + 1, genId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase({ tag: "idle" });
    }
  }, [phase, iterations, userRemarks, runGenerate]);

  const isIdle = phase.tag === "idle";
  const isEvaluated = phase.tag === "evaluated";
  const isDone = phase.tag === "done";
  const isWorking = ["generating", "evaluating", "healing"].includes(phase.tag);

  const evaluatedPhase = isEvaluated ? (phase as Extract<Phase, { tag: "evaluated" }>) : null;
  const passedThreshold = evaluatedPhase ? evaluatedPhase.scores.overall >= SCORE_THRESHOLD : false;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
          <Wand2 className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold">Self-Healing Playground</h1>
          <p className="text-sm text-muted-foreground">Generate → Evaluate → Repair, automatically</p>
        </div>
        {isDone && (
          <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-full bg-primary/12 border border-primary/25">
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
                disabled={!isIdle}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground/50">Quick examples</p>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  disabled={!isIdle}
                  className="w-full text-left text-sm px-3.5 py-2.5 rounded-xl border border-border bg-card hover:bg-secondary hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all disabled:opacity-40 flex items-start gap-2.5"
                >
                  <ChevronRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/40" />
                  <span className="line-clamp-2 leading-snug">{ex}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-border space-y-2">
            {isIdle ? (
              <Button
                onClick={async () => {
                  // Create a generation record first, then run
                  try {
                    const res = await fetch("/api/generations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ prompt }),
                    });
                    const data = await res.json();
                    const genId: string | undefined = res.ok ? data.id : undefined;
                    await runGenerate(prompt, 1, genId);
                  } catch {
                    await runGenerate(prompt, 1);
                  }
                }}
                disabled={!prompt.trim()}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm h-11 disabled:opacity-40 rounded-xl"
              >
                <Play className="h-4 w-4" />
                Generate &amp; Evaluate
              </Button>
            ) : isDone ? (
              <Button
                onClick={reset}
                variant="outline"
                className="w-full gap-2 border-border text-foreground/60 hover:text-foreground hover:bg-secondary h-11 rounded-xl"
              >
                <RefreshCw className="h-4 w-4" />
                Start Over
              </Button>
            ) : (
              <div className="h-11 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {phase.tag === "healing" ? "Healing with Seed 2.0..." : "Pipeline running..."}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Idle empty state */}
          {isIdle && iterations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <div className="h-20 w-20 rounded-3xl bg-card border border-border flex items-center justify-center mb-5">
                <Clapperboard className="h-9 w-9 text-muted-foreground/30" />
              </div>
              <h3 className="text-lg font-bold text-foreground/60 mb-2">Ready when you are</h3>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Enter a prompt on the left and hit Generate. SeedTrace will produce the video, score it with Seed 2.0, then pause here so you can review — and decide what happens next.
              </p>
            </div>
          )}

          {/* ── Active pipeline state (very visible) ─── */}
          {isWorking && (
            <div className="m-6">
              <ActivePipelineCard phase={phase as Extract<Phase, { tag: "generating" | "evaluating" | "healing" }>} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-6 mt-6 p-4 rounded-xl border border-destructive/30 bg-destructive/8">
              <p className="text-sm font-medium text-destructive">Error: {error}</p>
            </div>
          )}

          {/* Past iterations (compact) */}
          {iterations.length > 0 && (
            <div className="px-6 pt-6 space-y-3">
              {!isDone && (
                <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-wider">
                  Previous iterations
                </p>
              )}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {iterations.map((iter) => (
                  <PastIterationCard key={iter.iteration} iter={iter} />
                ))}
              </div>
            </div>
          )}

          {/* Current evaluation — interactive pause */}
          {isEvaluated && evaluatedPhase && (
            <EvaluationPanel
              phase={evaluatedPhase}
              iterations={iterations}
              userRemarks={userRemarks}
              setUserRemarks={setUserRemarks}
              passedThreshold={passedThreshold}
              onAccept={handleAccept}
              onHeal={handleHeal}
            />
          )}

          {/* Done state */}
          {isDone && (
            <DonePanel
              bestIteration={(phase as Extract<Phase, { tag: "done" }>).bestIteration}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Active pipeline card ─────────────────────────────────── */

const PHASE_CONFIG = {
  generating: {
    icon: Clapperboard,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/25",
    label: (iteration: number) => `Generating iteration ${iteration} with Seedance 2.0`,
    sub: "Submitting job to BytePlus and waiting for the video to render",
  },
  evaluating: {
    icon: ScanSearch,
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/25",
    label: (iteration: number) => `Evaluating iteration ${iteration} with Seed 2.0`,
    sub: "Seed 2.0 Vision is scoring prompt adherence, temporal consistency, and physical logic",
  },
  healing: {
    icon: Wrench,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/25",
    label: (iteration: number) => `Rewriting prompt after iteration ${iteration}`,
    sub: "Seed 2.0 is combining the AI analysis and your remarks into an improved prompt",
  },
} as const;

function ActivePipelineCard({
  phase,
}: {
  phase: Extract<Phase, { tag: "generating" | "evaluating" | "healing" }>;
}) {
  const cfg = PHASE_CONFIG[phase.tag];
  const Icon = cfg.icon;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-6`}>
      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-6">
        {(["generating", "evaluating"] as const).map((step, i) => {
          const isDone =
            (step === "generating" && (phase.tag === "evaluating" || phase.tag === "healing")) ||
            (step === "evaluating" && phase.tag === "healing");
          const isActive = phase.tag === step;
          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-primary/20 text-primary"
                    : isActive
                    ? `${cfg.bg} ${cfg.color} border ${cfg.border}`
                    : "bg-white/5 text-muted-foreground/40"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs font-medium capitalize ${
                  isActive ? cfg.color : isDone ? "text-primary" : "text-muted-foreground/40"
                }`}
              >
                {step}
              </span>
              {i < 1 && <div className="w-8 h-px bg-white/10 mx-1" />}
            </div>
          );
        })}
      </div>

      {/* Main status */}
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
          <Icon className={`h-6 w-6 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className={`h-4 w-4 animate-spin ${cfg.color} shrink-0`} />
            <h3 className="text-base font-bold">{cfg.label(phase.iteration)}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{cfg.sub}</p>
        </div>
      </div>

      {/* Current prompt */}
      {"prompt" in phase && phase.prompt && (
        <div className="mt-5 p-4 rounded-xl bg-background/40 border border-border">
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider mb-2">
            Prompt in use
          </p>
          <p className="text-sm font-mono text-foreground/80 leading-relaxed">{phase.prompt}</p>
        </div>
      )}

      {/* Animated skeleton for video placeholder */}
      {phase.tag === "generating" && (
        <div className="mt-4 rounded-xl overflow-hidden aspect-video bg-background/30 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Clapperboard className="h-8 w-8 text-muted-foreground/20 mx-auto" />
              <p className="text-xs text-muted-foreground/30">Video rendering...</p>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5">
            <div className={`h-full ${phase.tag === "generating" ? "bg-primary/60" : "bg-accent/60"} animate-pulse`} style={{ width: "60%" }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Past iteration (compact card) ───────────────────────── */

function PastIterationCard({ iter }: { iter: IterationResult }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <span className="text-sm font-bold text-muted-foreground">#{iter.iteration}</span>
        {iter.healed && (
          <Badge className="text-xs h-5 px-2 bg-accent/15 text-accent border-accent/25">Healed</Badge>
        )}
        <span className="ml-auto text-sm font-bold font-mono text-muted-foreground/70">
          {iter.scores.overall}/100
        </span>
      </div>
      <video src={iter.videoUrl} controls muted className="w-full bg-black aspect-video" />
    </div>
  );
}

/* ─── Evaluation panel (the interactive pause) ─────────────── */

function EvaluationPanel({
  phase,
  iterations,
  userRemarks,
  setUserRemarks,
  passedThreshold,
  onAccept,
  onHeal,
}: {
  phase: Extract<Phase, { tag: "evaluated" }>;
  iterations: IterationResult[];
  userRemarks: string;
  setUserRemarks: (v: string) => void;
  passedThreshold: boolean;
  onAccept: () => void;
  onHeal: () => void;
}) {
  const isLastIteration = phase.iteration >= 3;
  const prevScore = iterations.length > 0 ? iterations[iterations.length - 1].scores.overall : null;
  const delta = prevScore !== null ? phase.scores.overall - prevScore : null;

  return (
    <div className="mx-6 mt-6 mb-6">
      {/* Status banner */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          passedThreshold
            ? "border-primary/30 bg-primary/5"
            : "border-accent/20 bg-accent/5"
        }`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <CheckCircle2 className={`h-5 w-5 shrink-0 ${passedThreshold ? "text-primary" : "text-accent"}`} />
              <span className="text-base font-bold">
                Iteration {phase.iteration} complete — your turn
              </span>
              {delta !== null && (
                <Badge
                  className={`text-xs font-mono font-bold ${
                    delta >= 0
                      ? "bg-primary/15 text-primary border-primary/25"
                      : "bg-destructive/15 text-destructive border-destructive/25"
                  }`}
                >
                  {delta >= 0 ? "+" : ""}{delta} pts
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {passedThreshold
                ? `Score ${phase.scores.overall} clears the ${SCORE_THRESHOLD} threshold. You can accept this or keep polishing.`
                : `Score ${phase.scores.overall} is below ${SCORE_THRESHOLD}. Review the issues, add your notes, then heal or accept.`}
            </p>
          </div>
          <Badge
            className={`shrink-0 text-sm font-bold px-3 py-1 ${
              passedThreshold
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-accent/15 text-accent border-accent/25"
            }`}
          >
            {passedThreshold ? "Passed ✓" : "Below threshold"}
          </Badge>
        </div>

        {/* Content grid */}
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Video */}
          <div>
            <video
              src={phase.videoUrl}
              controls
              muted
              autoPlay
              loop
              className="w-full bg-black aspect-video"
            />
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">{phase.prompt}</p>
            </div>
          </div>

          {/* Scores + actions */}
          <div className="p-5 flex flex-col gap-5">
            <ScoreCard scores={phase.scores} />

            {/* User remarks */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                <MessageSquarePlus className="h-4 w-4" />
                Your remarks
                <span className="text-xs font-normal text-muted-foreground">(optional)</span>
              </label>
              <Textarea
                value={userRemarks}
                onChange={(e) => setUserRemarks(e.target.value)}
                placeholder="Add what you noticed — lighting off, colors wrong, motion too fast... Seed 2.0 will use this when rewriting the prompt."
                className="min-h-[90px] resize-none text-sm bg-background/50 border-border focus:border-primary/40 placeholder:text-muted-foreground/30 leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <Button
                onClick={onAccept}
                className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 rounded-xl"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept this video
              </Button>
              {!isLastIteration ? (
                <Button
                  onClick={onHeal}
                  variant="outline"
                  className="w-full gap-2 border-border text-foreground/60 hover:text-foreground hover:bg-secondary h-11 rounded-xl"
                >
                  <Wand2 className="h-4 w-4" />
                  Heal &amp; retry — iteration {phase.iteration + 1} of 3
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

/* ─── Done panel ───────────────────────────────────────────── */

function DonePanel({ bestIteration }: { bestIteration: IterationResult }) {
  return (
    <div className="mx-6 mt-6 mb-6">
      <div className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <Star className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold">Best result — iteration #{bestIteration.iteration}</p>
            <p className="text-sm text-muted-foreground">This scored highest across all iterations</p>
          </div>
          <Badge className="ml-auto bg-primary/15 text-primary border-primary/25 text-sm font-bold px-3 py-1">
            {bestIteration.scores.overall}/100
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <div>
            <video src={bestIteration.videoUrl} controls muted className="w-full bg-black aspect-video" />
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">{bestIteration.prompt}</p>
            </div>
          </div>
          <div className="p-5">
            <ScoreCard scores={bestIteration.scores} />
          </div>
        </div>
      </div>
    </div>
  );
}
