"use client";

import { Badge } from "@/components/ui/badge";
import { ScoreCard } from "./ScoreCard";
import { Wand2, Star } from "lucide-react";
import type { IterationResult } from "@/lib/types";

interface IterationCardProps {
  result: IterationResult;
  prevScore?: number;
  isBest?: boolean;
}

export function IterationCard({ result, prevScore, isBest }: IterationCardProps) {
  const delta = prevScore != null ? result.scores.overall - prevScore : null;

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        isBest
          ? "border-green-500/30 bg-green-500/5"
          : "border-white/8 bg-white/2"
      }`}
    >
      {/* Card header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
        <span className="text-xs text-white/40 font-mono">
          #{result.iteration}
        </span>
        {result.healed && (
          <Badge className="text-[10px] h-4 px-1.5 bg-purple-500/15 text-purple-400 border-purple-500/20 hover:bg-purple-500/15 gap-1">
            <Wand2 className="h-2.5 w-2.5" />
            Healed
          </Badge>
        )}
        {isBest && (
          <Badge className="text-[10px] h-4 px-1.5 bg-green-500/15 text-green-400 border-green-500/20 hover:bg-green-500/15 gap-1">
            <Star className="h-2.5 w-2.5" />
            Best
          </Badge>
        )}
        {delta != null && (
          <span
            className={`ml-auto text-xs font-bold font-mono ${
              delta >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {delta >= 0 ? "+" : ""}
            {delta} pts
          </span>
        )}
      </div>

      {/* Prompt */}
      <div className="px-4 py-2 border-b border-white/5">
        <p className="text-[10px] text-white/30 font-mono leading-relaxed line-clamp-2">
          {result.prompt}
        </p>
      </div>

      {/* Video */}
      <video
        src={result.videoUrl}
        controls
        muted
        className="w-full bg-black aspect-video"
      />

      {/* Scores */}
      <div className="p-4">
        <ScoreCard scores={result.scores} />
      </div>
    </div>
  );
}
