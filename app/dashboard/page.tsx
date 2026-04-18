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
  | {
      tag: "evaluated";
      prompt: string;
      iteration: number;
      videoUrl: string;
      scores: EvaluationResult;
    }
  | { tag: "healing"; prompt: string; iteration: number }
  | { tag: "done"; bestIteration: IterationResult };

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

  const runGenerate = useCallback(
    async (currentPrompt: string, iteration: number) => {
      setError(null);
      setPhase({ tag: "generating", prompt: currentPrompt, iteration });

      try {
        const genRes = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: currentPrompt }),
        });
        const genData = await genRes.json();
        if (!genRes.ok) throw new Error(genData.error ?? "Generation failed");

        const videoUrl: string = genData.videoUrl;

        // Immediately kick off evaluation
        const evalRes = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl, prompt: currentPrompt }),
        });
        const evalData = await evalRes.json();
        if (!evalRes.ok) throw new Error(evalData.error ?? "Evaluation failed");

        const scores: EvaluationResult = evalData;

        setPhase({
          tag: "evaluated",
          prompt: currentPrompt,
          iteration,
          videoUrl,
          scores,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setPhase({ tag: "idle" });
      }
    },
    []
  );

  const handleAccept = useCallback(() => {
    if (phase.tag !== "evaluated") return;
    const iter: IterationResult = {
      iteration: phase.iteration,
      prompt: phase.prompt,
      videoUrl: phase.videoUrl,
      scores: phase.scores,
      healed: phase.iteration > 1,
    };
    const all = [...iterations, iter];
    setIterations(all);

    const best = all.reduce((a, b) =>
      b.scores.overall > a.scores.overall ? b : a
    );
    setPhase({ tag: "done", bestIteration: best });
  }, [phase, iterations]);

  const handleHeal = useCallback(async () => {
    if (phase.tag !== "evaluated") return;
    const { prompt: currentPrompt, iteration, videoUrl, scores } = phase;

    const iter: IterationResult = {
      iteration,
      prompt: currentPrompt,
      videoUrl,
      scores,
      healed: iteration > 1,
    };
    setIterations((prev) => [...prev, iter]);

    if (iteration >= 3) {
      const all = [...iterations, iter];
      const best = all.reduce((a, b) =>
        b.scores.overall > a.scores.overall ? b : a
      );
      setPhase({ tag: "done", bestIteration: best });
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

      const improvedPrompt: string = healData.improvedPrompt;
      setUserRemarks("");
      await runGenerate(improvedPrompt, iteration + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase({ tag: "idle" });
    }
  }, [phase, iterations, userRemarks, runGenerate]);

  const isIdle = phase.tag === "idle";
  const isEvaluated = phase.tag === "evaluated";
  const isDone = phase.tag === "done";

  const passedThreshold =
    isEvaluated && (phase as { tag: "evaluated"; scores: EvaluationResult }).scores.overall >= SCORE_THRESHOLD;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <Wand2 className="h-4 w-4 text-green-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Self-Healing Playground</h1>
          <p className="text-xs text-white/40">Generate → Evaluate → Repair automatically</p>
        </div>
        {isDone && (
          <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
            <Sparkles className="h-3 w-3 text-green-400" />
            <span className="text-xs text-green-400 font-medium">
              Best score: {(phase as { tag: "done"; bestIteration: IterationResult }).bestIteration.scores.overall}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-72 shrink-0 border-r border-white/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-white/50">Prompt</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the video you want to generate..."
                className="min-h-[120px] resize-none text-sm bg-white/3 border-white/10 focus:border-green-500/40 placeholder:text-white/20 font-mono"
                disabled={!isIdle}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-white/30">Quick examples</p>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(ex)}
                  disabled={!isIdle}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-white/6 bg-white/2 hover:bg-white/5 hover:border-white/10 text-white/40 hover:text-white/70 transition-colors disabled:opacity-40 flex items-start gap-2"
                >
                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-white/20" />
                  <span className="line-clamp-2">{ex}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-white/5 space-y-2">
            {isIdle ? (
              <Button
                onClick={() => runGenerate(prompt, 1)}
                disabled={!prompt.trim()}
                className="w-full gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold disabled:opacity-40"
              >
                <Play className="h-4 w-4" />
                Generate &amp; Evaluate
              </Button>
            ) : isDone ? (
              <Button
                onClick={reset}
                variant="outline"
                className="w-full gap-2 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
                Start Over
              </Button>
            ) : (
              <div className="flex items-center gap-2 justify-center text-xs text-white/30">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-green-400" />
                {phase.tag === "generating"
                  ? `Generating iteration ${(phase as { tag: "generating"; iteration: number }).iteration}...`
                  : phase.tag === "healing"
                  ? "Healing prompt..."
                  : "Evaluating..."}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Idle empty state */}
          {isIdle && iterations.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-8 py-16">
              <div className="h-16 w-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mb-4">
                <Wand2 className="h-7 w-7 text-white/20" />
              </div>
              <h3 className="text-sm font-medium text-white/50 mb-2">No results yet</h3>
              <p className="text-xs text-white/25 max-w-xs leading-relaxed">
                Enter a prompt and hit Generate. SeedTrace will generate your video, evaluate it with Seed 2.0, and pause here so you can review before deciding what to do next.
              </p>
            </div>
          )}

          {/* Loading state */}
          {(phase.tag === "generating" || phase.tag === "healing") && (
            <div className="mx-6 mt-6 p-5 rounded-xl border border-white/8 bg-white/2 flex items-center gap-4">
              <Loader2 className="h-5 w-5 text-green-400 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-medium text-white/70">
                  {phase.tag === "healing" ? "Healing prompt with Seed 2.0..." : `Generating iteration ${(phase as { tag: "generating"; iteration: number }).iteration} with Seedance 2.0...`}
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  {phase.tag === "healing"
                    ? "Rewriting the prompt to address detected issues and your remarks"
                    : "Submitting job, polling for completion, then running evaluation"}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mx-6 mt-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5">
              <p className="text-sm text-red-400">Error: {error}</p>
            </div>
          )}

          {/* Past iterations */}
          {iterations.length > 0 && (
            <div className="px-6 pt-6 space-y-3">
              <p className="text-xs font-medium text-white/30 uppercase tracking-wider">
                Previous iterations
              </p>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {iterations.map((iter) => (
                  <PastIterationCard key={iter.iteration} iter={iter} />
                ))}
              </div>
            </div>
          )}

          {/* Current evaluation — the interactive pause */}
          {isEvaluated && (
            <EvaluationPanel
              phase={phase as Extract<Phase, { tag: "evaluated" }>}
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

/* ─── Sub-components ─────────────────────────────────────── */

function PastIterationCard({ iter }: { iter: IterationResult }) {
  return (
    <div className="rounded-xl border border-white/6 bg-white/2 overflow-hidden">
      <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
        <span className="text-xs text-white/40 font-mono">#{iter.iteration}</span>
        {iter.healed && (
          <Badge className="text-[10px] h-4 px-1.5 bg-purple-500/15 text-purple-400 border-purple-500/20">Healed</Badge>
        )}
        <span className="ml-auto text-xs font-mono font-bold text-white/40">{iter.scores.overall}/100</span>
      </div>
      <video src={iter.videoUrl} controls muted className="w-full bg-black aspect-video" />
    </div>
  );
}

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
      <div
        className={`rounded-xl border overflow-hidden ${
          passedThreshold ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5"
        }`}
      >
        {/* Evaluation header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-sm font-semibold">
                Iteration {phase.iteration} — Evaluation Complete
              </span>
              {delta !== null && (
                <span className={`text-xs font-bold font-mono ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {delta >= 0 ? "+" : ""}{delta} pts
                </span>
              )}
            </div>
            <p className="text-xs text-white/40">
              {passedThreshold
                ? `Score ${phase.scores.overall} meets the quality threshold (${SCORE_THRESHOLD}). You can accept this video or keep healing.`
                : `Score ${phase.scores.overall} is below the threshold (${SCORE_THRESHOLD}). Consider healing or accepting anyway.`}
            </p>
          </div>
          <Badge
            className={`shrink-0 text-xs px-2 py-0.5 ${
              passedThreshold
                ? "bg-green-500/15 text-green-400 border-green-500/20"
                : "bg-yellow-500/15 text-yellow-400 border-yellow-500/20"
            }`}
          >
            {passedThreshold ? "Passed" : "Below threshold"}
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
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
              <p className="text-[10px] text-white/30 font-mono leading-relaxed">{phase.prompt}</p>
            </div>
          </div>

          {/* Scores + actions */}
          <div className="p-5 flex flex-col gap-5">
            <ScoreCard scores={phase.scores} />

            {/* User remarks */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-medium text-white/50">
                <MessageSquarePlus className="h-3.5 w-3.5" />
                Your remarks (optional)
              </label>
              <Textarea
                value={userRemarks}
                onChange={(e) => setUserRemarks(e.target.value)}
                placeholder="Add anything you noticed — lighting issues, wrong colors, motion feels off... Seed 2.0 will incorporate your notes when healing."
                className="min-h-[80px] resize-none text-xs bg-white/3 border-white/10 focus:border-green-500/40 placeholder:text-white/15"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={onAccept}
                className="w-full gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept this video
              </Button>
              {!isLastIteration ? (
                <Button
                  onClick={onHeal}
                  variant="outline"
                  className="w-full gap-2 border-white/10 text-white/60 hover:text-white hover:bg-white/5"
                >
                  <Wand2 className="h-4 w-4" />
                  Heal &amp; Retry (iteration {phase.iteration + 1}/3)
                </Button>
              ) : (
                <p className="text-center text-xs text-white/25">Max iterations reached</p>
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
    <div className="mx-6 mt-6 mb-6">
      <div className="rounded-xl border border-green-500/30 bg-green-500/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
          <Star className="h-4 w-4 text-green-400" />
          <span className="text-sm font-semibold">Best result — iteration #{bestIteration.iteration}</span>
          <Badge className="ml-auto bg-green-500/15 text-green-400 border-green-500/20">
            {bestIteration.scores.overall}/100
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div>
            <video src={bestIteration.videoUrl} controls muted className="w-full bg-black aspect-video" />
            <div className="px-4 py-3">
              <p className="text-[10px] text-white/30 font-mono leading-relaxed">{bestIteration.prompt}</p>
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
