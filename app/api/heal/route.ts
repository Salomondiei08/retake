import { NextRequest, NextResponse } from "next/server";
import { repairPrompt } from "@/lib/seed2";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { prompt, scores, userRemarks } = await req.json();
    if (!prompt || !scores) {
      return NextResponse.json({ error: "prompt and scores required" }, { status: 400 });
    }
    const improvedPrompt = await repairPrompt(prompt, scores, userRemarks ?? "");
    return NextResponse.json({ improvedPrompt });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
