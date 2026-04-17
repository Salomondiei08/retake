"use client";

import { Loader2, CheckCircle2, Video, Search, Wand2 } from "lucide-react";
import type { PipelineEvent } from "@/lib/types";

interface Step {
  label: string;
  status: "active" | "done";
  icon: "generate" | "evaluate" | "heal";
}

function getSteps(events: PipelineEvent[]): Step[] {
  const steps: Step[] = [];

  for (const ev of events) {
    if (ev.type === "iteration_start" && ev.iteration != null) {
      steps.push({
        label: `Iteration ${ev.iteration}: Generating with Seedance 2.0`,
        status: "active",
        icon: "generate",
      });
    }
    if (ev.type === "evaluating") {
      const last = steps[steps.length - 1];
      if (last) last.status = "done";
      steps.push({
        label: `Iteration ${ev.iteration}: Evaluating with Seed 2.0`,
        status: "active",
        icon: "evaluate",
      });
    }
    if (ev.type === "healing") {
      const last = steps[steps.length - 1];
      if (last) last.status = "done";
      if (ev.repairedPrompt) {
        steps.push({
          label: "Prompt repaired — preparing retry",
          status: "done",
          icon: "heal",
        });
      } else {
        steps.push({
          label: "Score below threshold — rewriting prompt",
          status: "active",
          icon: "heal",
        });
      }
    }
    if (ev.type === "done" || ev.type === "iteration_done") {
      const last = steps[steps.length - 1];
      if (last?.status === "active") last.status = "done";
    }
  }

  return steps;
}

const ICONS = { generate: Video, evaluate: Search, heal: Wand2 };

export function PipelineProgress({ events }: { events: PipelineEvent[] }) {
  const steps = getSteps(events);
  if (steps.length === 0) return null;

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const Icon = ICONS[step.icon];
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="shrink-0">
              {step.status === "active" ? (
                <Loader2 className="h-3.5 w-3.5 text-green-400 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              )}
            </div>
            <Icon
              className={`h-3.5 w-3.5 shrink-0 ${
                step.status === "active" ? "text-white/40" : "text-white/20"
              }`}
            />
            <span
              className={`text-xs ${
                step.status === "active" ? "text-white/80" : "text-white/30"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
