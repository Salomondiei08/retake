"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScoreCard } from "@/components/ScoreCard";
import {
  Play,
  Plus,
  Trash2,
  Save,
  FlaskConical,
  Pencil,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type {
  BenchmarkPrompt,
  PromptResult,
  SuiteBaseline,
  SuiteEvent,
  SuiteRun,
} from "@/lib/types";

const DEFAULT_PROMPTS: BenchmarkPrompt[] = [
  {
    id: "p1",
    label: "Product shot",
    prompt:
      "A sleek smartphone rotating slowly on a white reflective surface, studio lighting, product photography, 4K ultra HD",
    threshold: 70,
  },
  {
    id: "p2",
    label: "Nature scene",
    prompt:
      "Ocean waves crashing on a rocky coastline at golden hour, cinematic wide shot, slow motion",
    threshold: 70,
  },
  {
    id: "p3",
    label: "Urban motion",
    prompt:
      "Time-lapse of a busy city intersection at night, car light trails, overhead drone view",
    threshold: 70,
  },
];

function useSuiteStorage() {
  const [prompts, setPrompts] = useState<BenchmarkPrompt[]>(DEFAULT_PROMPTS);
  const [baseline, setBaseline] = useState<SuiteBaseline | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedPrompts = localStorage.getItem("st_prompts");
    const savedBaseline = localStorage.getItem("st_baseline");
    if (savedPrompts) setPrompts(JSON.parse(savedPrompts));
    if (savedBaseline) setBaseline(JSON.parse(savedBaseline));
    setHydrated(true);
  }, []);

  const savePrompts = (p: BenchmarkPrompt[]) => {
    setPrompts(p);
    localStorage.setItem("st_prompts", JSON.stringify(p));
  };

  const saveBaseline = (b: SuiteBaseline) => {
    setBaseline(b);
    localStorage.setItem("st_baseline", JSON.stringify(b));
  };

  return { prompts, baseline, savePrompts, saveBaseline, hydrated };
}

export default function SuitePage() {
  const { prompts, baseline, savePrompts, saveBaseline, hydrated } = useSuiteStorage();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<string, PromptResult>>({});
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const [run, setRun] = useState<SuiteRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addPrompt = () => {
    const id = crypto.randomUUID();
    const newPrompts = [
      ...prompts,
      { id, label: "New benchmark", prompt: "", threshold: 70 },
    ];
    savePrompts(newPrompts);
    setEditingId(id);
  };

  const removePrompt = (id: string) =>
    savePrompts(prompts.filter((p) => p.id !== id));

  const updatePrompt = (id: string, patch: Partial<BenchmarkPrompt>) =>
    savePrompts(prompts.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const saveAsBaseline = () => {
    const b: SuiteBaseline = {};
    for (const r of Object.values(results)) b[r.promptId] = r.avgScore;
    saveBaseline(b);
  };

  const runSuite = useCallback(async () => {
    if (running || prompts.length === 0) return;
    setRunning(true);
    setResults({});
    setRun(null);
    setError(null);
    setActiveIds(new Set(prompts.map((p) => p.id)));
    setExpandedIds(new Set());

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
              setResults((prev) => ({ ...prev, [ev.result!.promptId]: ev.result! }));
              setActiveIds((prev) => {
                const next = new Set(prev);
                next.delete(ev.result!.promptId);
                return next;
              });
              setExpandedIds((prev) => new Set([...prev, ev.result!.promptId]));
            }
            if (ev.type === "done" && ev.run) setRun(ev.run);
            if (ev.type === "error") setError(ev.message ?? "Unknown error");
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setRunning(false);
      setActiveIds(new Set());
    }
  }, [running, prompts, baseline]);

  const hasResults = Object.keys(results).length > 0;

  if (!hydrated) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/5 flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
          <FlaskConical className="h-4 w-4 text-green-400" />
        </div>
        <div>
          <h1 className="text-sm font-semibold">Prompt CI/CD Suite</h1>
          <p className="text-xs text-white/40">
            Define benchmarks · Run · Detect regressions
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {run && (
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${
                run.status === "pass"
                  ? "bg-green-500/10 border-green-500/20 text-green-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}
            >
              {run.status === "pass" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5" />
              )}
              {run.passed}/{run.results.length} passed
            </div>
          )}
          {hasResults && !running && (
            <Button
              variant="ghost"
              size="sm"
              onClick={saveAsBaseline}
              className="h-8 gap-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 text-xs"
            >
              <Save className="h-3.5 w-3.5" />
              Save baseline
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={addPrompt}
            disabled={running}
            className="h-8 gap-1.5 text-white/40 hover:text-white/70 hover:bg-white/5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </Button>
          <Button
            size="sm"
            onClick={runSuite}
            disabled={running || prompts.length === 0}
            className="h-8 gap-1.5 bg-green-500 hover:bg-green-400 text-black font-semibold text-xs"
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {running ? "Running..." : "Run Suite"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {error && (
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400">Error: {error}</p>
          </div>
        )}

        {prompts.map((bp) => {
          const result = results[bp.id];
          const isActive = activeIds.has(bp.id);
          const isExpanded = expandedIds.has(bp.id);
          const baselineDelta = result?.baselineDelta;

          return (
            <div
              key={bp.id}
              className={`rounded-xl border transition-colors ${
                isActive
                  ? "border-green-500/30 bg-green-500/3"
                  : result
                  ? result.status === "pass"
                    ? "border-green-500/15 bg-white/2"
                    : "border-red-500/15 bg-white/2"
                  : "border-white/8 bg-white/2"
              }`}
            >
              {/* Row header */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => result && toggleExpand(bp.id)}
                  className="shrink-0 text-white/20 hover:text-white/50 transition-colors disabled:pointer-events-none"
                  disabled={!result}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === bp.id ? (
                    <div className="space-y-2">
                      <input
                        className="w-full text-sm font-medium bg-transparent border-b border-white/20 focus:border-green-500/50 outline-none pb-0.5"
                        value={bp.label}
                        onChange={(e) => updatePrompt(bp.id, { label: e.target.value })}
                        placeholder="Benchmark label..."
                      />
                      <Textarea
                        value={bp.prompt}
                        onChange={(e) => updatePrompt(bp.id, { prompt: e.target.value })}
                        className="text-xs font-mono min-h-[72px] resize-none bg-white/5 border-white/10"
                        placeholder="Video generation prompt..."
                      />
                      <Button
                        size="sm"
                        onClick={() => setEditingId(null)}
                        className="h-7 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 border-0"
                      >
                        Done
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">{bp.label}</p>
                      <p className="text-xs text-white/30 font-mono line-clamp-1 mt-0.5">
                        {bp.prompt || "No prompt set"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isActive && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Running
                    </div>
                  )}

                  {result && (
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold font-mono ${
                          result.status === "pass" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {result.avgScore}
                      </span>
                      <Badge
                        className={`text-xs ${
                          result.status === "pass"
                            ? "bg-green-500/15 text-green-400 border-green-500/20 hover:bg-green-500/15"
                            : "bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/15"
                        }`}
                      >
                        {result.status.toUpperCase()}
                      </Badge>
                      {baselineDelta != null && (
                        <span
                          className={`text-xs font-semibold ${
                            baselineDelta >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {baselineDelta >= 0 ? "+" : ""}
                          {baselineDelta}
                        </span>
                      )}
                    </div>
                  )}

                  {baseline && baseline[bp.id] != null && !result && (
                    <span className="text-xs text-white/20">
                      Baseline: {baseline[bp.id]}
                    </span>
                  )}

                  {editingId !== bp.id && (
                    <button
                      onClick={() => setEditingId(bp.id)}
                      disabled={running}
                      className="p-1.5 rounded-md text-white/20 hover:text-white/50 hover:bg-white/5 transition-colors disabled:opacity-40"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => removePrompt(bp.id)}
                    disabled={running}
                    className="p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Expanded results */}
              {isExpanded && result && (
                <div className="px-4 pb-4 border-t border-white/5 pt-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    {result.videos.map((url, i) => (
                      <div key={i} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white/30">Video {i + 1}</p>
                          <span className="text-xs font-mono font-semibold text-white/60">
                            {result.scores[i].overall}
                          </span>
                        </div>
                        <video
                          src={url}
                          controls
                          muted
                          className="w-full rounded-lg bg-black aspect-video"
                        />
                        <ScoreCard scores={result.scores[i]} />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-white/30">
                    <span>Threshold: {result.threshold}</span>
                    <span>
                      Avg score:{" "}
                      <span className="text-white font-semibold">
                        {result.avgScore}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {prompts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mb-4">
              <FlaskConical className="h-6 w-6 text-white/20" />
            </div>
            <p className="text-sm text-white/40 mb-1">No benchmarks yet</p>
            <p className="text-xs text-white/20 mb-4">Add prompts to run the CI suite</p>
            <Button
              size="sm"
              onClick={addPrompt}
              className="gap-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Add benchmark
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
