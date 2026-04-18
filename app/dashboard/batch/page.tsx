"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Layers, Play, Square, Download, Upload, Loader2, CheckCircle2,
  XCircle, Clock, Wand2, ScanSearch, Wrench, ChevronDown, ChevronUp,
  Copy, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { BatchEvent, BatchPromptResult, EvaluationResult, PipelineEvent } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────

type PromptStatus =
  | "queued"
  | "generating"
  | "evaluating"
  | "healing"
  | "done"
  | "failed";

interface PromptCard {
  index: number;
  prompt: string;
  status: PromptStatus;
  /** Latest pipeline sub-step label */
  subLabel?: string;
  result?: BatchPromptResult;
  /** Current best score seen so far */
  liveScore?: number;
  /** Iteration we're currently on */
  liveIteration?: number;
  /** Healed prompt preview */
  healedPrompt?: string;
}

// ── Helpers ──────────────────────────────────────────────────

function statusLabel(status: PromptStatus): string {
  switch (status) {
    case "queued": return "Queued";
    case "generating": return "Generating";
    case "evaluating": return "Evaluating";
    case "healing": return "Healing";
    case "done": return "Done";
    case "failed": return "Failed";
  }
}

function statusColor(status: PromptStatus) {
  switch (status) {
    case "queued": return "text-muted-foreground bg-white/5 border-white/10";
    case "generating": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
    case "evaluating": return "text-violet-400 bg-violet-400/10 border-violet-400/20";
    case "healing": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
    case "done": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
    case "failed": return "text-red-400 bg-red-400/10 border-red-400/20";
  }
}

function statusIcon(status: PromptStatus) {
  switch (status) {
    case "queued": return <Clock className="h-3 w-3" />;
    case "generating": return <Loader2 className="h-3 w-3 animate-spin" />;
    case "evaluating": return <ScanSearch className="h-3 w-3 animate-pulse" />;
    case "healing": return <Wrench className="h-3 w-3 animate-pulse" />;
    case "done": return <CheckCircle2 className="h-3 w-3" />;
    case "failed": return <XCircle className="h-3 w-3" />;
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-400";
  if (score >= 65) return "text-amber-400";
  return "text-red-400";
}

function pipelineEventToStatus(event: PipelineEvent): { status: PromptStatus; subLabel?: string; healedPrompt?: string } {
  switch (event.type) {
    case "generating": return { status: "generating", subLabel: `Iteration ${event.iteration ?? 1}` };
    case "evaluating": return { status: "evaluating", subLabel: `Iteration ${event.iteration ?? 1}` };
    case "healing": return {
      status: "healing",
      subLabel: event.repairedPrompt ? "Prompt repaired" : "Repairing prompt…",
      healedPrompt: event.repairedPrompt,
    };
    default: return { status: "queued" };
  }
}

// ── Card component ────────────────────────────────────────────

function PromptCardView({ card, index: cardIndex }: { card: PromptCard; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const best = card.result?.bestIteration;
  const passed = card.result?.passed;
  const score = best?.scores.overall ?? card.liveScore;

  const copyPrompt = useCallback(async () => {
    const text = best?.prompt ?? card.prompt;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [best, card.prompt]);

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-300",
        card.status === "done" && passed
          ? "border-emerald-500/30 bg-emerald-500/5"
          : card.status === "done" && !passed
          ? "border-red-500/20 bg-red-500/5"
          : card.status === "failed"
          ? "border-red-500/25 bg-red-500/8"
          : "border-border bg-card"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {/* Index pill */}
        <span className="shrink-0 mt-0.5 h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">
          {cardIndex + 1}
        </span>

        <div className="flex-1 min-w-0">
          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge
              className={cn(
                "text-[11px] font-semibold border px-2 py-0.5 flex items-center gap-1.5",
                statusColor(card.status)
              )}
            >
              {statusIcon(card.status)}
              {statusLabel(card.status)}
              {card.liveIteration && card.status !== "done" && (
                <span className="opacity-70">· it.{card.liveIteration}</span>
              )}
            </Badge>

            {score != null && (
              <span className={cn("text-xs font-bold tabular-nums", scoreColor(score))}>
                {score}
                <span className="opacity-60 font-normal">/100</span>
              </span>
            )}

            {card.status === "done" && (
              <Badge
                className={cn(
                  "text-[11px] border px-2 py-0.5",
                  passed
                    ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                    : "text-red-400 bg-red-400/10 border-red-400/20"
                )}
              >
                {passed ? "Passed" : "Below threshold"}
              </Badge>
            )}
          </div>

          {/* Prompt text */}
          <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
            {card.prompt}
          </p>

          {/* Sub-label */}
          {card.subLabel && card.status !== "done" && (
            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
              <Loader2 className="h-2.5 w-2.5 animate-spin shrink-0" />
              {card.subLabel}
            </p>
          )}

          {/* Healed prompt preview */}
          {card.healedPrompt && card.status === "healing" && (
            <div className="mt-2.5 p-2.5 rounded-lg bg-orange-400/8 border border-orange-400/20">
              <p className="text-[11px] font-semibold text-orange-400 mb-1">Healed prompt</p>
              <p className="text-xs text-foreground/70 line-clamp-2">{card.healedPrompt}</p>
            </div>
          )}
        </div>
      </div>

      {/* Video + details (done state) */}
      {card.status === "done" && best && (
        <>
          {/* Video thumbnail */}
          <div className="px-4 pb-3">
            <video
              src={best.videoUrl}
              className="w-full rounded-xl aspect-video object-cover bg-black/40"
              controls
              playsInline
              preload="metadata"
            />
          </div>

          {/* Score bars + expand */}
          <div className="px-4 pb-4">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide" : "Show"} score breakdown
            </button>

            {expanded && (
              <ScoreBreakdown scores={best.scores} />
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={copyPrompt}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors border border-white/8"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy best prompt"}
              </button>
              <a
                href={best.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors border border-white/8"
              >
                <Download className="h-3 w-3" />
                Open video
              </a>
            </div>
          </div>
        </>
      )}

      {/* Error */}
      {card.status === "failed" && card.result?.error && (
        <div className="px-4 pb-4">
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {card.result.error}
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreBreakdown({ scores }: { scores: EvaluationResult }) {
  const bars: { label: string; key: keyof EvaluationResult }[] = [
    { label: "Prompt adherence", key: "prompt_adherence" },
    { label: "Temporal consistency", key: "temporal_consistency" },
    { label: "Physical logic", key: "physical_logic" },
  ];

  return (
    <div className="space-y-2">
      {bars.map(({ label, key }) => {
        const val = scores[key] as number;
        return (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{label}</span>
              <span className={cn("font-semibold tabular-nums", scoreColor(val))}>{val}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  val >= 80 ? "bg-emerald-400" : val >= 65 ? "bg-amber-400" : "bg-red-400"
                )}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        );
      })}

      {scores.failure_reasons.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/6">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1">Issues found</p>
          {scores.failure_reasons.map((r, i) => (
            <p key={i} className="text-[11px] text-muted-foreground/70 leading-snug">· {r}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  "A golden retriever running through a sunflower field at sunset, cinematic slow motion, 4K",
  "Futuristic city skyline at night with flying cars and neon lights, rain reflecting on streets",
  "A barista pouring latte art in a cozy café, close-up, warm lighting, shallow depth of field",
  "Ocean waves crashing on rocky coastline at golden hour, wide cinematic shot",
].join("\n");

export default function BatchPage() {
  const [promptText, setPromptText] = useState("");
  const [maxIterations, setMaxIterations] = useState(3);
  const [cards, setCards] = useState<PromptCard[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [summary, setSummary] = useState<{ passed: number; failed: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const parsedPrompts = promptText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 20);

  const updateCard = useCallback((index: number, patch: Partial<PromptCard>) => {
    setCards((prev) =>
      prev.map((c) => (c.index === index ? { ...c, ...patch } : c))
    );
  }, []);

  const handleRun = useCallback(async () => {
    if (parsedPrompts.length === 0 || isRunning) return;

    // Initialise cards
    const initial: PromptCard[] = parsedPrompts.map((prompt, i) => ({
      index: i,
      prompt,
      status: "queued",
    }));
    setCards(initial);
    setIsDone(false);
    setSummary(null);
    setIsRunning(true);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: parsedPrompts, maxIterations }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) throw new Error("Batch request failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (!json) continue;

          const ev = JSON.parse(json) as BatchEvent;

          if (ev.type === "prompt_start" && ev.index != null) {
            updateCard(ev.index, { status: "generating", subLabel: "Starting…", liveIteration: 1 });
          }

          if (ev.type === "prompt_progress" && ev.index != null && ev.event) {
            const inner = ev.event;
            const { status, subLabel, healedPrompt } = pipelineEventToStatus(inner);

            const patch: Partial<PromptCard> = { status, subLabel };
            if (healedPrompt) patch.healedPrompt = healedPrompt;
            if (inner.iteration != null) patch.liveIteration = inner.iteration;
            if (inner.scores?.overall != null) patch.liveScore = inner.scores.overall;

            updateCard(ev.index, patch);
          }

          if (ev.type === "prompt_done" && ev.index != null && ev.result) {
            updateCard(ev.index, {
              status: ev.result.error ? "failed" : "done",
              result: ev.result,
              subLabel: undefined,
              liveScore: ev.result.bestIteration?.scores.overall,
              liveIteration: undefined,
              healedPrompt: undefined,
            });
          }

          if (ev.type === "batch_done" && ev.results) {
            const passed = ev.results.filter((r) => r.passed).length;
            const failed = ev.results.length - passed;
            setSummary({ passed, failed, total: ev.results.length });
            setIsDone(true);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // User stopped — mark remaining queued/in-progress cards as failed
        setCards((prev) =>
          prev.map((c) =>
            c.status !== "done" && c.status !== "failed"
              ? {
                  ...c,
                  status: "failed" as const,
                  result: c.result
                    ? { ...c.result, error: "Stopped by user" }
                    : {
                        index: c.index, prompt: c.prompt,
                        bestIteration: null, allIterations: [],
                        passed: false, error: "Stopped by user",
                      },
                }
              : c
          )
        );
      }
    } finally {
      setIsRunning(false);
      abortRef.current = null;
    }
  }, [parsedPrompts, maxIterations, isRunning, updateCard]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleLoadExample = useCallback(() => {
    setPromptText(EXAMPLE_PROMPTS);
  }, []);

  const handleExport = useCallback(() => {
    const rows = cards
      .filter((c) => c.status === "done" && c.result?.bestIteration)
      .map((c) => {
        const b = c.result!.bestIteration!;
        return [
          JSON.stringify(c.prompt),
          JSON.stringify(b.prompt),
          b.scores.overall,
          b.videoUrl,
          c.result!.passed ? "pass" : "fail",
        ].join(",");
      });
    const csv = ["original_prompt,best_prompt,score,video_url,status", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `seedtrace-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [cards]);

  const doneCount = cards.filter((c) => c.status === "done" || c.status === "failed").length;
  const progress = cards.length > 0 ? Math.round((doneCount / cards.length) * 100) : 0;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">
      {/* ── Left panel: input ─────────────────────────────── */}
      <div className="w-full lg:w-96 shrink-0 border-b lg:border-b-0 lg:border-r border-border flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Layers className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">Batch Run</h1>
              <p className="text-xs text-muted-foreground">Run many prompts in parallel</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
          {/* Prompts input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-foreground">
                Prompts
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  one per line, up to 20
                </span>
              </label>
              <button
                onClick={handleLoadExample}
                className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
              >
                Load examples
              </button>
            </div>
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={"A cinematic drone shot over misty mountains...\nA cat wearing a tiny top hat, studio portrait...\nNeon-lit rain on Tokyo streets at midnight..."}
              className="min-h-[220px] font-mono text-xs resize-none bg-card border-border focus:border-primary/50 focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
              disabled={isRunning}
            />
            {parsedPrompts.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {parsedPrompts.length} prompt{parsedPrompts.length !== 1 ? "s" : ""} detected
              </p>
            )}
          </div>

          {/* CSV upload */}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors group">
            <div className="h-8 px-3 rounded-lg border border-dashed border-border group-hover:border-primary/50 flex items-center gap-2 transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Upload CSV (prompt column)
            </div>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              disabled={isRunning}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const text = ev.target?.result as string;
                  // Try to parse CSV — grab first column of each row
                  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
                  const prompts = lines.map((line) => {
                    // Handle quoted CSV values
                    const first = line.startsWith('"')
                      ? line.split('"')[1]
                      : line.split(",")[0];
                    return first.trim();
                  }).filter(Boolean);
                  setPromptText(prompts.join("\n"));
                };
                reader.readAsText(file);
                e.target.value = "";
              }}
            />
          </label>

          {/* Options */}
          <div>
            <label className="text-sm font-semibold text-foreground block mb-2">
              Max iterations per prompt
            </label>
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setMaxIterations(n)}
                  disabled={isRunning}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border transition-all",
                    maxIterations === n
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-white/4 border-border text-muted-foreground hover:text-foreground hover:border-white/20"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {maxIterations === 1 && "Fast mode — one shot per prompt, no healing."}
              {maxIterations === 2 && "Standard — one heal attempt if score is low."}
              {maxIterations === 3 && "Thorough — up to two heal attempts for best quality."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 mt-auto pt-2">
            {!isRunning ? (
              <Button
                onClick={handleRun}
                disabled={parsedPrompts.length === 0}
                className="w-full h-11 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-4 w-4 mr-2" />
                Run Batch ({parsedPrompts.length} prompt{parsedPrompts.length !== 1 ? "s" : ""})
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                variant="outline"
                className="w-full h-11 text-sm font-semibold border-red-500/40 text-red-400 hover:bg-red-500/10 hover:border-red-500/60"
              >
                <Square className="h-4 w-4 mr-2" />
                Stop
              </Button>
            )}

            {isDone && cards.some((c) => c.status === "done") && (
              <Button
                onClick={handleExport}
                variant="outline"
                className="w-full h-10 text-sm border-primary/30 text-primary hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Right panel: results ──────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Progress bar + summary */}
        {cards.length > 0 && (
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-foreground">
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Running… {doneCount}/{cards.length} done
                  </span>
                ) : isDone ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Batch complete
                  </span>
                ) : (
                  "Ready"
                )}
              </span>
              {summary && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-emerald-400 font-semibold">{summary.passed} passed</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-red-400 font-semibold">{summary.failed} failed</span>
                </div>
              )}
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Cards grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {cards.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {cards.map((card) => (
                <PromptCardView key={card.index} card={card} index={card.index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center px-6">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Layers className="h-7 w-7 text-primary/60" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Batch Processing</h2>
      <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
        Enter your prompts on the left — one per line or upload a CSV. Each prompt gets its own
        self-healing pipeline running in parallel.
      </p>
      <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
        {[
          { icon: <Wand2 className="h-3.5 w-3.5" />, label: "Auto-heals", desc: "Low scores trigger prompt repair" },
          { icon: <Layers className="h-3.5 w-3.5" />, label: "Concurrent", desc: "2 prompts run at the same time" },
          { icon: <Download className="h-3.5 w-3.5" />, label: "Exportable", desc: "Download results as CSV" },
        ].map((f) => (
          <div key={f.label} className="p-3 rounded-xl border border-border bg-card text-left">
            <div className="text-primary mb-2">{f.icon}</div>
            <p className="font-semibold text-foreground">{f.label}</p>
            <p className="text-muted-foreground mt-0.5 leading-snug">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
