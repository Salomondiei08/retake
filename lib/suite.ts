import { generateVideo } from "./seedance";
import { evaluateVideo } from "./seed2";
import type {
  BenchmarkPrompt,
  EvaluationResult,
  PromptResult,
  SuiteBaseline,
  SuiteEvent,
  SuiteRun,
} from "./types";

const VIDEOS_PER_PROMPT = 3;

export async function runSuite(
  prompts: BenchmarkPrompt[],
  baseline: SuiteBaseline | null,
  emit: (event: SuiteEvent) => void
): Promise<void> {
  const results: PromptResult[] = [];

  for (const bp of prompts) {
    emit({ type: "prompt_start", promptId: bp.id, label: bp.label });

    const videos: string[] = [];
    const scores: EvaluationResult[] = [];

    for (let v = 0; v < VIDEOS_PER_PROMPT; v++) {
      const videoUrl = await generateVideo(bp.prompt);
      videos.push(videoUrl);
      const score = await evaluateVideo(videoUrl, bp.prompt);
      scores.push(score);
    }

    const avgScore =
      Math.round(scores.reduce((sum, s) => sum + s.overall, 0) / scores.length);

    const baselineDelta =
      baseline && baseline[bp.id] != null
        ? avgScore - baseline[bp.id]
        : null;

    const status = avgScore >= bp.threshold ? "pass" : "fail";

    const result: PromptResult = {
      promptId: bp.id,
      label: bp.label,
      prompt: bp.prompt,
      videos,
      scores,
      avgScore,
      baselineDelta,
      status,
      threshold: bp.threshold,
    };

    results.push(result);
    emit({ type: "prompt_done", promptId: bp.id, result });
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;

  const run: SuiteRun = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    results,
    passed,
    failed,
    status: failed > 0 ? "fail" : "pass",
  };

  emit({ type: "done", run });
}
