"use client";

import type { EvaluationResult } from "@/lib/types";

interface ScoreCardProps {
  scores: EvaluationResult;
  delta?: number | null;
}

function scoreColor(score: number) {
  if (score >= 75) return "text-green-400";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function barColor(score: number) {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

const METRICS = [
  { key: "prompt_adherence" as const, label: "Adherence" },
  { key: "temporal_consistency" as const, label: "Temporal" },
  { key: "physical_logic" as const, label: "Physical" },
];

export function ScoreCard({ scores, delta }: ScoreCardProps) {
  return (
    <div className="space-y-3">
      {/* Overall score */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${scoreColor(scores.overall)}`}>
            {scores.overall}
          </span>
          <span className="text-xs text-white/30">/ 100</span>
        </div>
        {delta != null && (
          <span
            className={`text-xs font-semibold font-mono ${
              delta >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>

      {/* Metric bars */}
      <div className="space-y-2">
        {METRICS.map((m) => {
          const val = scores[m.key];
          return (
            <div key={m.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-white/30">{m.label}</span>
                <span className={`text-[10px] font-mono font-semibold ${scoreColor(val)}`}>
                  {val}
                </span>
              </div>
              <div className="h-1 rounded-full bg-white/5 overflow-hidden">
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
        <div className="space-y-1 pt-1">
          {scores.failure_reasons.map((r, i) => (
            <p key={i} className="text-[10px] text-red-400/70 leading-snug">
              · {r}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
