"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "./ScoreCard";
import type { IterationResult } from "@/lib/types";

interface IterationCardProps {
  result: IterationResult;
  prevScore?: number;
  isBest?: boolean;
}

export function IterationCard({ result, prevScore, isBest }: IterationCardProps) {
  const delta =
    prevScore != null ? result.scores.overall - prevScore : null;

  return (
    <Card
      className={`border ${
        isBest ? "border-green-500/50 bg-green-950/10" : "border-border"
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-muted-foreground">
            Iteration {result.iteration}
          </span>
          {result.healed && (
            <Badge variant="secondary" className="text-xs">
              Auto-healed
            </Badge>
          )}
          {isBest && (
            <Badge className="text-xs bg-green-600 hover:bg-green-600">
              Best
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono leading-relaxed line-clamp-2">
          {result.prompt}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <video
          src={result.videoUrl}
          controls
          muted
          className="w-full rounded-md bg-black aspect-video"
        />
        <ScoreCard scores={result.scores} delta={delta} />
      </CardContent>
    </Card>
  );
}
