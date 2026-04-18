/**
 * /api/landing-videos
 *
 * GET  — returns cached video URLs (or empty object if nothing generated yet).
 *         If any slot is missing OR the signed URL expires within 2 hours,
 *         kicks off background generation so the next poll has fresh URLs.
 *         Client polls every 8s until complete.
 *
 * POST — force-regenerates all slots (dev helper).
 *
 * Cache lives in .landing-video-cache.json at the project root (gitignored).
 * URLs come straight from the Seedance CDN — no proxying, no bandwidth cost.
 *
 * URL freshness: Seedance CDN uses signed TOS URLs that expire after 24 hours.
 * We parse X-Tos-Date + X-Tos-Expires from the query string and regenerate
 * any slot whose URL will expire within the next 2 hours.
 */

import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { generateVideo } from "@/lib/seedance";

const CACHE_FILE = path.join(process.cwd(), ".landing-video-cache.json");

/** Each slot: stable id + prompt used to generate it */
const SLOTS = [
  {
    id: "hero_v1",
    prompt:
      "A cyberpunk owl landing on a Tokyo rooftop, rain reflecting neon lights, cinematic",
  },
  {
    id: "hero_v2",
    prompt:
      "A cyberpunk owl gliding onto a wet Tokyo rooftop at night, feathers catching pink and teal neon reflected in puddles, 24fps cinematic, crisp temporal consistency",
  },
] as const;

type SlotId = (typeof SLOTS)[number]["id"];
type VideoCache = Record<SlotId, string>;

// In-process lock — prevents parallel requests from double-generating the same slot
const generating = new Set<SlotId>();

async function readCache(): Promise<Partial<VideoCache>> {
  try {
    const raw = await fs.readFile(CACHE_FILE, "utf-8");
    return JSON.parse(raw) as Partial<VideoCache>;
  } catch {
    return {};
  }
}

async function writeCache(data: Partial<VideoCache>) {
  await fs.writeFile(CACHE_FILE, JSON.stringify(data, null, 2));
}

/**
 * Parse Seedance's signed URL and check whether it expires within `windowMs`.
 * X-Tos-Date format: 20260418T145712Z  (UTC, ISO-8601 basic)
 * X-Tos-Expires:     86400             (seconds from X-Tos-Date)
 * Returns true if the URL is still fresh (expires more than windowMs from now).
 */
function isFresh(url: string, windowMs = 2 * 60 * 60 * 1000): boolean {
  try {
    const u = new URL(url);
    const dateStr = u.searchParams.get("X-Tos-Date"); // e.g. "20260418T145712Z"
    const expiresStr = u.searchParams.get("X-Tos-Expires"); // e.g. "86400"
    if (!dateStr || !expiresStr) return true; // no expiry params → assume fine

    // Parse "20260418T145712Z" → Date
    const d = dateStr; // "20260418T145712Z"
    const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T${d.slice(9, 11)}:${d.slice(11, 13)}:${d.slice(13, 15)}Z`;
    const signedAt = new Date(iso).getTime();
    const expiresAt = signedAt + parseInt(expiresStr, 10) * 1000;

    return expiresAt - Date.now() > windowMs;
  } catch {
    return false; // parse failed → treat as stale
  }
}

/** Fire-and-forget: generate one slot and persist the URL when done. */
function triggerGeneration(slot: (typeof SLOTS)[number]) {
  if (generating.has(slot.id)) return;
  generating.add(slot.id);

  generateVideo(slot.prompt)
    .then(async (url) => {
      // Re-read cache before writing so parallel slots don't clobber each other
      const fresh = await readCache();
      fresh[slot.id] = url;
      await writeCache(fresh);
      console.log(`[landing-videos] ✓ ${slot.id}`);
    })
    .catch((err) => {
      console.error(`[landing-videos] ✗ ${slot.id}:`, err);
    })
    .finally(() => {
      generating.delete(slot.id);
    });
}

export async function GET() {
  const cache = await readCache();

  // Kick off background generation for any missing or stale slot
  for (const slot of SLOTS) {
    const url = cache[slot.id];
    const needsRegen = !url || !isFresh(url);
    if (needsRegen) {
      // Clear stale entry so clients show placeholder until fresh URL is ready
      if (url && !isFresh(url)) {
        delete cache[slot.id];
        await writeCache(cache);
      }
      triggerGeneration(slot);
    }
  }

  return NextResponse.json({
    videos: cache,
    complete: SLOTS.every((s) => Boolean(cache[s.id])),
    pending: SLOTS.filter((s) => !cache[s.id]).map((s) => s.id),
  });
}

/** Force-regenerate all slots (useful when you want fresh videos). */
export async function POST() {
  await writeCache({} as Partial<VideoCache>);
  for (const slot of SLOTS) triggerGeneration(slot);
  return NextResponse.json({ started: SLOTS.map((s) => s.id) });
}
