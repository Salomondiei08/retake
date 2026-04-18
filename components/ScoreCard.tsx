"use client";

import type { EvaluationResult } from "@/lib/types";

interface ScoreCardProps {
  scores: EvaluationResult;
  delta?: number | null;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-primary";
  if (score >= 50) return "text-yellow-400";
  return "text-destructive";
}

function barColor(score: number) {
  if (score >= 75) return "bg-primary";
  if (score >= 50) return "bg-yellow-500";
  return "bg-destructive";
}

const METRICS = [
  { key: "prompt_adherence" as const, label: "Prompt adherence" },
  { key: "temporal_consistency" as const, label: "Temporal consistency" },
  { key: "physical_logic" as const, label: "Physical logic" },
];

export function ScoreCard({ scores, delta }: ScoreCardProps) {
  return (
    <div className="space-y-4">
      {/* Overall score */}
      <div className="flex items-end justify-between">
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold font-mono leading-none ${scoreColor(scores.overall)}`}>
            {scores.overall}
          </span>
          <span className="text-base text-muted-foreground mb-0.5">/ 100</span>
        </div>
        {delta != null && (
          <span
            className={`text-sm font-bold font-mono ${
              delta >= 0 ? "text-primary" : "text-destructive"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        )}
      </div>

      {/* Metric bars */}
      <div className="space-y-3">
        {METRICS.map((m) => {
          const val = scores[m.key];
          return (
            <div key={m.key}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-medium text-muted-foreground">{m.label}</span>
                <span className={`text-xs font-bold font-mono ${scoreColor(val)}`}>{val}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor(val)}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Failure reasons */}
      {scores.failure_reasons.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">Issues found</p>
          {scores.failure_reasons.map((r, i) => (
            <p key={i} className="text-sm text-destructive/80 leading-snug">
              · {r}
            </p>
          ))}
        </div>
      )}

      {/* Repair suggestions */}
      {scores.repair_suggestions && scores.repair_suggestions.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wider">AI suggestions</p>
          {scores.repair_suggestions.map((s, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-snug">
              · {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
