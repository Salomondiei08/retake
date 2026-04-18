import { NextRequest, NextResponse } from "next/server";
import { evaluateVideo } from "@/lib/seed2";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const { videoUrl, prompt } = await req.json();
    if (!videoUrl || !prompt) {
      return NextResponse.json({ error: "videoUrl and prompt required" }, { status: 400 });
    }
    const result = await evaluateVideo(videoUrl, prompt);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
