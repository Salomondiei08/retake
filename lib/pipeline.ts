import { generateVideo } from "./seedance";
import { evaluateVideo, repairPrompt } from "./seed2";
import type { IterationResult, PipelineEvent } from "./types";

const DEFAULT_THRESHOLD = parseInt(process.env.SCORE_THRESHOLD ?? "75", 10);
const DEFAULT_MAX_ITERATIONS = 3;

export interface PipelineOptions {
  maxIterations?: number;
  threshold?: number;
  userRemarks?: string;
}

export async function runSelfHealingPipeline(
  originalPrompt: string,
  emit: (event: PipelineEvent) => void,
  options: PipelineOptions = {}
): Promise<void> {
  const maxIterations = options.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const userRemarks = options.userRemarks ?? "";

  const allIterations: IterationResult[] = [];
  let currentPrompt = originalPrompt;

  for (let i = 1; i <= maxIterations; i++) {
    emit({ type: "iteration_start", iteration: i, prompt: currentPrompt });

    emit({ type: "generating", iteration: i, prompt: currentPrompt });
    const videoUrl = await generateVideo(currentPrompt);

    emit({ type: "evaluating", iteration: i, videoUrl, prompt: currentPrompt });
    const scores = await evaluateVideo(videoUrl, originalPrompt);

    const iteration: IterationResult = {
      iteration: i,
      prompt: currentPrompt,
      videoUrl,
      scores,
      healed: i > 1,
    };
    allIterations.push(iteration);

    emit({ type: "iteration_done", iteration: i, videoUrl, scores, prompt: currentPrompt });

    if (scores.overall >= threshold || i === maxIterations) {
      const best = allIterations.reduce((a, b) =>
        a.scores.overall >= b.scores.overall ? a : b
      );
      emit({ type: "done", bestIteration: best, allIterations });
      return;
    }

    // Heal: emit before + after so UI can show what changed
    emit({ type: "healing", iteration: i, scores, oldPrompt: currentPrompt });
    const repairedPrompt = await repairPrompt(currentPrompt, scores, userRemarks);
    currentPrompt = repairedPrompt;
    emit({ type: "healing", iteration: i, repairedPrompt, oldPrompt: allIterations[i - 1].prompt });
  }
}
