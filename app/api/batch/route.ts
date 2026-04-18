import { type NextRequest } from "next/server";
import { runSelfHealingPipeline } from "@/lib/pipeline";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { PipelineEvent, BatchEvent, BatchPromptResult, EvaluationResult } from "@/lib/types";

export const maxDuration = 300;

const CONCURRENCY = 2; // run N prompts in parallel

async function runPromptWithCollection(
  index: number,
  prompt: string,
  maxIterations: number,
  onEvent: (ev: BatchEvent) => void
): Promise<BatchPromptResult> {
  const iterations: Array<{ iteration: number; prompt: string; videoUrl: string; scores: EvaluationResult; healed: boolean }> = [];

  const emit = (event: PipelineEvent) => {
    onEvent({ type: "prompt_progress", index, prompt, event });

    if (event.type === "iteration_done" && event.videoUrl && event.scores && event.iteration != null) {
      iterations.push({
        iteration: event.iteration,
        prompt: event.prompt ?? prompt,
        videoUrl: event.videoUrl,
        scores: event.scores,
        healed: event.iteration > 1,
      });
    }
  };

  try {
    await runSelfHealingPipeline(prompt, emit, { maxIterations });

    const best = iterations.length > 0
      ? iterations.reduce((a, b) => b.scores.overall > a.scores.overall ? b : a)
      : null;

    return {
      index,
      prompt,
      bestIteration: best,
      allIterations: iterations,
      passed: (best?.scores.overall ?? 0) >= parseInt(process.env.SCORE_THRESHOLD ?? "75", 10),
    };
  } catch (err) {
    return {
      index,
      prompt,
      bestIteration: null,
      allIterations: [],
      passed: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const { prompts, maxIterations = 3 } = (await req.json()) as {
    prompts: string[];
    maxIterations?: number;
  };

  if (!Array.isArray(prompts) || prompts.length === 0) {
    return new Response(JSON.stringify({ error: "prompts array required" }), { status: 400 });
  }

  const cleanPrompts = prompts.map((p) => p.trim()).filter(Boolean).slice(0, 20);

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: BatchEvent) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      send({ type: "batch_start", total: cleanPrompts.length });

      const results: BatchPromptResult[] = new Array(cleanPrompts.length);
      const queue = cleanPrompts.map((prompt, index) => ({ prompt, index }));
      const inFlight = new Set<number>();

      const runNext = async () => {
        const item = queue.shift();
        if (!item) return;
        const { prompt, index } = item;
        inFlight.add(index);
        send({ type: "prompt_start", index, prompt, total: cleanPrompts.length });

        const result = await runPromptWithCollection(index, prompt, maxIterations, send);
        results[index] = result;
        inFlight.delete(index);
        send({ type: "prompt_done", index, prompt, result });

        // Save to DB if authenticated
        if (session?.user?.id && result.bestIteration) {
          try {
            const gen = await db.generation.create({
              data: {
                userId: session.user.id,
                prompt,
                status: "done",
                bestScore: result.bestIteration.scores.overall,
              },
            });
            for (const it of result.allIterations) {
              await db.iteration.create({
                data: {
                  generationId: gen.id,
                  iterationNum: it.iteration,
                  prompt: it.prompt,
                  videoUrl: it.videoUrl,
                  scores: JSON.parse(JSON.stringify(it.scores)),
                  healed: it.healed,
                  accepted: it.iteration === result.bestIteration?.iteration,
                },
              });
            }
          } catch { /* don't block SSE on DB errors */ }
        }

        // Keep concurrency slot filled
        await runNext();
      };

      // Start N concurrent runners
      const runners: Promise<void>[] = [];
      for (let i = 0; i < Math.min(CONCURRENCY, cleanPrompts.length); i++) {
        runners.push(runNext());
      }

      await Promise.all(runners);

      send({ type: "batch_done", results });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
