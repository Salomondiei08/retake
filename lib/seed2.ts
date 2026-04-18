import type { EvaluationResult } from "./types";

const BYTEPLUS_API_BASE =
  process.env.BYTEPLUS_API_BASE ?? "https://ark.ap-southeast.bytepluses.com/api/v3";
const API_KEY = process.env.BYTEPLUS_API_KEY ?? "";
const VISION_MODEL = process.env.SEED2_VISION_MODEL ?? "Seed-2.0-pro";
const TEXT_MODEL = process.env.SEED2_TEXT_MODEL ?? "Seed-2.0-pro";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "video_url"; video_url: { url: string } }
      >;
}

interface ChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

async function chatCompletion(
  messages: ChatMessage[],
  model: string
): Promise<string> {
  const res = await fetch(`${BYTEPLUS_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Seed 2.0 API failed (${res.status}): ${body}`);
  }

  const data: ChatResponse = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

export async function evaluateVideo(
  videoUrl: string,
  originalPrompt: string
): Promise<EvaluationResult> {
  const systemPrompt = `You are a video quality evaluator for AI-generated video.
Analyze the provided video and score it on these dimensions:
- prompt_adherence (0-100): How well the video matches the original prompt
- temporal_consistency (0-100): Whether objects/characters maintain consistent appearance across frames
- physical_logic (0-100): Whether motion and physics look realistic
- overall (0-100): Weighted average (40% adherence, 35% temporal, 25% physical)

Return ONLY valid JSON in this exact schema:
{
  "prompt_adherence": <number>,
  "temporal_consistency": <number>,
  "physical_logic": <number>,
  "overall": <number>,
  "failure_reasons": [<string>, ...],
  "repair_suggestions": [<string>, ...]
}

failure_reasons: list specific issues found (max 3)
repair_suggestions: actionable prompt improvements that would fix each issue (max 3)`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Original prompt: "${originalPrompt}"\n\nEvaluate this video:`,
        },
        {
          type: "video_url",
          video_url: { url: videoUrl },
        },
      ],
    },
  ];

  const raw = await chatCompletion(messages, VISION_MODEL);

  try {
    const parsed = JSON.parse(extractJson(raw)) as EvaluationResult;
    parsed.overall = Math.round(
      parsed.prompt_adherence * 0.4 +
        parsed.temporal_consistency * 0.35 +
        parsed.physical_logic * 0.25
    );
    return parsed;
  } catch {
    throw new Error(`Seed 2.0 returned invalid JSON: ${raw}`);
  }
}

export async function repairPrompt(
  originalPrompt: string,
  result: EvaluationResult,
  userRemarks = ""
): Promise<string> {
  const systemPrompt = `You are a video generation prompt engineer.
Your task is to rewrite a prompt to fix specific quality issues identified in the generated video.
Return ONLY the improved prompt as a JSON object: { "improved_prompt": "<prompt>" }
Rules:
- Keep the same core idea and subject
- Add specificity to fix the failure reasons
- Use concrete, descriptive language (colors, textures, camera angles, motion style)
- Max 150 words`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Original prompt: "${originalPrompt}"

Quality issues found:
${result.failure_reasons.map((r, i) => `${i + 1}. ${r}`).join("\n")}

Repair suggestions:
${result.repair_suggestions.map((s, i) => `${i + 1}. ${s}`).join("\n")}

Scores: adherence=${result.prompt_adherence}, temporal=${result.temporal_consistency}, physical=${result.physical_logic}
${userRemarks ? `\nUser additional notes: ${userRemarks}` : ""}
Write an improved prompt that addresses these issues:`,
    },
  ];

  const raw = await chatCompletion(messages, TEXT_MODEL);

  try {
    const parsed = JSON.parse(extractJson(raw)) as { improved_prompt: string };
    return parsed.improved_prompt ?? originalPrompt;
  } catch {
    const match = raw.match(/"improved_prompt"\s*:\s*"([^"]+)"/);
    return match?.[1] ?? originalPrompt;
  }
}

function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const braced = text.match(/(\{[\s\S]*\})/);
  if (braced) return braced[1].trim();
  return text.trim();
}
