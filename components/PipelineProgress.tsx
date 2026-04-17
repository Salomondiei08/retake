"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2, Wand2, Video, Search, CheckCircle2 } from "lucide-react";
import type { PipelineEvent } from "@/lib/types";

interface Step {
  label: string;
  status: "pending" | "active" | "done";
  icon: "generate" | "evaluate" | "heal";
  iteration: number;
}

interface PipelineProgressProps {
  events: PipelineEvent[];
}

function getSteps(events: PipelineEvent[]): Step[] {
  const steps: Step[] = [];

  for (const ev of events) {
    if (ev.type === "iteration_start" && ev.iteration != null) {
      steps.push({
        label: `Iteration ${ev.iteration}: Generating`,
        status: "active",
        icon: "generate",
        iteration: ev.iteration,
      });
    }
    if (ev.type === "evaluating") {
      const last = steps[steps.length - 1];
      if (last) last.status = "done";
      steps.push({
        label: `Iteration ${ev.iteration}: Evaluating with Seed 2.0`,
        status: "active",
        icon: "evaluate",
        iteration: ev.iteration ?? 0,
      });
    }
    if (ev.type === "healing") {
      const last = steps[steps.length - 1];
      if (last) last.status = "done";
      if (ev.repairedPrompt) {
        steps.push({
          label: `Score below threshold — healing prompt`,
          status: "done",
          icon: "heal",
          iteration: ev.iteration ?? 0,
        });
      } else {
        steps.push({
          label: `Analyzing failures — repairing prompt`,
          status: "active",
          icon: "heal",
          iteration: ev.iteration ?? 0,
        });
      }
    }
    if (ev.type === "done" || ev.type === "iteration_done") {
      const last = steps[steps.length - 1];
      if (last && last.status === "active") last.status = "done";
    }
  }

  return steps;
}

const iconMap = {
  generate: Video,
  evaluate: Search,
  heal: Wand2,
};

export function PipelineProgress({ events }: PipelineProgressProps) {
  const steps = getSteps(events);

  if (steps.length === 0) return null;

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const Icon = iconMap[step.icon];
        return (
          <div key={i} className="flex items-center gap-3 text-sm">
            {step.status === "active" ? (
              <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            ) : step.status === "done" ? (
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span
              className={
                step.status === "active"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              {step.label}
            </span>
            {step.status === "active" && (
              <Badge variant="secondary" className="text-xs ml-auto shrink-0">
                Running
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
