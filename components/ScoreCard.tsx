"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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

function scoreLabel(score: number) {
  if (score >= 75) return "PASS";
  if (score >= 50) return "WARN";
  return "FAIL";
}

function scoreBadgeVariant(score: number): "default" | "secondary" | "destructive" {
  if (score >= 75) return "default";
  if (score >= 50) return "secondary";
  return "destructive";
}

export function ScoreCard({ scores, delta }: ScoreCardProps) {
  const metrics = [
    { label: "Prompt Adherence", value: scores.prompt_adherence },
    { label: "Temporal Consistency", value: scores.temporal_consistency },
    { label: "Physical Logic", value: scores.physical_logic },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold ${scoreColor(scores.overall)}`}>
            {scores.overall}
          </span>
          <Badge variant={scoreBadgeVariant(scores.overall)} className="text-xs">
            {scoreLabel(scores.overall)}
          </Badge>
        </div>
        {delta != null && (
          <span
            className={`text-sm font-semibold ${
              delta >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        )}
      </div>

      <div className="space-y-2">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{m.label}</span>
              <span className={scoreColor(m.value)}>{m.value}</span>
            </div>
            <Progress value={m.value} className="h-1.5" />
          </div>
        ))}
      </div>

      {scores.failure_reasons.length > 0 && (
        <div className="space-y-1">
          {scores.failure_reasons.map((reason, i) => (
            <p key={i} className="text-xs text-red-400/80 leading-snug">
              • {reason}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
