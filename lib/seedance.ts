const BYTEPLUS_API_BASE =
  process.env.BYTEPLUS_API_BASE ?? "https://ark.ap-southeast.bytepluses.com/api/v3";
const API_KEY = process.env.BYTEPLUS_API_KEY ?? "";
const VIDEO_MODEL = process.env.SEEDANCE_MODEL ?? "seedance-2-0-pro-v1";

interface TaskCreateResponse {
  id: string;
  status: string;
}

interface TaskGetResponse {
  id: string;
  status: "running" | "succeeded" | "failed" | "queued";
  content?: {
    video_url?: string;
  };
  error?: {
    message: string;
  };
}

async function createT2VTask(prompt: string): Promise<string> {
  const res = await fetch(`${BYTEPLUS_API_BASE}/contents/generations/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: VIDEO_MODEL,
      content: [
        {
          type: "text",
          text: prompt,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Seedance task create failed (${res.status}): ${body}`);
  }

  const data: TaskCreateResponse = await res.json();
  return data.id;
}

async function pollTask(taskId: string, maxWaitMs = 300_000): Promise<string> {
  const deadline = Date.now() + maxWaitMs;
  let delay = 5_000;

  while (Date.now() < deadline) {
    await sleep(delay);
    delay = Math.min(delay * 1.5, 20_000);

    const res = await fetch(
      `${BYTEPLUS_API_BASE}/contents/generations/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
      }
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Seedance poll failed (${res.status}): ${body}`);
    }

    const data: TaskGetResponse = await res.json();

    if (data.status === "succeeded") {
      const url = data.content?.video_url;
      if (!url) throw new Error("Seedance task succeeded but no video_url");
      return url;
    }

    if (data.status === "failed") {
      throw new Error(
        `Seedance task failed: ${data.error?.message ?? "unknown error"}`
      );
    }
  }

  throw new Error("Seedance task timed out after 5 minutes");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function generateVideo(prompt: string): Promise<string> {
  const taskId = await createT2VTask(prompt);
  return await pollTask(taskId);
}
