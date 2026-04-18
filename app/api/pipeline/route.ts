import { type NextRequest } from "next/server";
import { runSelfHealingPipeline } from "@/lib/pipeline";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { PipelineEvent, EvaluationResult } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await auth();
  const { prompt, userRemarks, maxIterations } = (await req.json()) as {
    prompt: string;
    userRemarks?: string;
    maxIterations?: number;
  };

  if (!prompt?.trim()) {
    return new Response(JSON.stringify({ error: "prompt required" }), { status: 400 });
  }

  let generationId: string | null = null;
  if (session?.user?.id) {
    const gen = await db.generation.create({
      data: { userId: session.user.id, prompt: prompt.trim(), status: "running" },
    });
    generationId = gen.id;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: PipelineEvent) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      if (generationId) {
        send({ type: "iteration_start", iteration: -1, prompt: generationId });
      }

      type CollectedIteration = {
        iteration: number;
        prompt: string;
        videoUrl: string;
        scores: EvaluationResult;
        healed: boolean;
      };
      const collected: CollectedIteration[] = [];

      const wrappedEmit = (event: PipelineEvent) => {
        send(event);
        if (event.type === "iteration_done" && event.videoUrl && event.scores && event.iteration != null) {
          collected.push({
            iteration: event.iteration,
            prompt: event.prompt ?? prompt,
            videoUrl: event.videoUrl,
            scores: event.scores,
            healed: event.iteration > 1,
          });
        }
      };

      try {
        await runSelfHealingPipeline(prompt.trim(), wrappedEmit, { maxIterations, userRemarks });

        if (generationId && collected.length > 0) {
          const best = collected.reduce((a, b) =>
            b.scores.overall > a.scores.overall ? b : a
          );
          await db.generation.update({
            where: { id: generationId },
            data: { status: "done", bestScore: best.scores.overall },
          });
          // createMany with JSON field — serialize via JSON round-trip to satisfy Prisma types
          for (const it of collected) {
            await db.iteration.create({
              data: {
                generationId: generationId!,
                iterationNum: it.iteration,
                prompt: it.prompt,
                videoUrl: it.videoUrl,
                scores: JSON.parse(JSON.stringify(it.scores)),
                healed: it.healed,
                accepted: true,
              },
            });
          }
        }
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
        if (generationId) {
          await db.generation.update({ where: { id: generationId }, data: { status: "error" } }).catch(() => {});
        }
      } finally {
        controller.close();
      }
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
