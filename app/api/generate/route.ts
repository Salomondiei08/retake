import { NextRequest, NextResponse } from "next/server";
import { generateVideo } from "@/lib/seedance";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt required" }, { status: 400 });
    }
    const videoUrl = await generateVideo(prompt);
    return NextResponse.json({ videoUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
