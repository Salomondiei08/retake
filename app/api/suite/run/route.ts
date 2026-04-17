import { type NextRequest } from "next/server";
import { runSuite } from "@/lib/suite";
import type { BenchmarkPrompt, SuiteBaseline, SuiteEvent } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const { prompts, baseline } = (await req.json()) as {
    prompts: BenchmarkPrompt[];
    baseline: SuiteBaseline | null;
  };

  if (!Array.isArray(prompts) || prompts.length === 0) {
    return new Response(JSON.stringify({ error: "prompts array required" }), {
      status: 400,
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SuiteEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      };

      try {
        await runSuite(prompts, baseline, send);
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
