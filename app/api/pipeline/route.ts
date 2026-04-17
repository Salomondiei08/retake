import { type NextRequest } from "next/server";
import { runSelfHealingPipeline } from "@/lib/pipeline";
import type { PipelineEvent } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { prompt } = (await req.json()) as { prompt: string };

  if (!prompt?.trim()) {
    return new Response(JSON.stringify({ error: "prompt required" }), {
      status: 400,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: PipelineEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      try {
        await runSelfHealingPipeline(prompt.trim(), send);
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
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
