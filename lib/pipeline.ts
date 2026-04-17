import { generateVideo } from "./seedance";
import { evaluateVideo, repairPrompt } from "./seed2";
import type { IterationResult, PipelineEvent } from "./types";

const PASS_THRESHOLD = parseInt(process.env.SCORE_THRESHOLD ?? "75", 10);
const MAX_ITERATIONS = 3;

export async function runSelfHealingPipeline(
  originalPrompt: string,
  emit: (event: PipelineEvent) => void
): Promise<void> {
  const allIterations: IterationResult[] = [];
  let currentPrompt = originalPrompt;

  for (let i = 1; i <= MAX_ITERATIONS; i++) {
    emit({ type: "iteration_start", iteration: i, prompt: currentPrompt });

    emit({ type: "generating", iteration: i });
    const videoUrl = await generateVideo(currentPrompt);

    emit({ type: "evaluating", iteration: i, videoUrl });
    const scores = await evaluateVideo(videoUrl, originalPrompt);

    const iteration: IterationResult = {
      iteration: i,
      prompt: currentPrompt,
      videoUrl,
      scores,
      healed: i > 1,
    };
    allIterations.push(iteration);

    emit({ type: "iteration_done", iteration: i, videoUrl, scores });

    if (scores.overall >= PASS_THRESHOLD || i === MAX_ITERATIONS) {
      const best = allIterations.reduce((a, b) =>
        a.scores.overall >= b.scores.overall ? a : b
      );
      emit({ type: "done", bestIteration: best, allIterations });
      return;
    }

    emit({ type: "healing", iteration: i, scores });
    const repairedPrompt = await repairPrompt(currentPrompt, scores);
    currentPrompt = repairedPrompt;
    emit({ type: "healing", iteration: i, repairedPrompt });
  }
}
