# SeedTrace

Self-healing video generation agent + prompt CI/CD suite. Built for the BytePlus Seedance hackathon (Track 3: AI DevTools for Video).

## What it does

**Self-Healing Playground:** Enter a prompt → Seedance 2.0 generates a video → Seed 2.0 evaluates quality (prompt adherence, temporal consistency, physical logic) → if score is below threshold, the agent rewrites the prompt and tries again automatically.

**Prompt CI/CD Suite:** Define a set of benchmark prompts. Run the suite to generate videos and score them. Compare against a saved baseline to detect quality regressions when you change your prompts or system configuration.

## Stack

- Next.js 15 (App Router)
- shadcn/ui + Tailwind CSS
- BytePlus Seedance 2.0 (T2V video generation)
- BytePlus Seed 2.0 (vision evaluation + prompt repair)
- SSE streaming for real-time progress

## Setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your BytePlus API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|---|---|
| `BYTEPLUS_API_KEY` | BytePlus ModelArk API key |
| `BYTEPLUS_API_BASE` | API base URL (default: `https://ark.ap-southeast.bytepluses.com/api/v3`) |
| `SEEDANCE_MODEL` | Seedance model ID (default: `seedance-2-0-pro-v1`) |
| `SEED2_VISION_MODEL` | Seed 2.0 vision model ID (default: `Seed-2.0-pro`) |
| `SEED2_TEXT_MODEL` | Seed 2.0 text model ID (default: `Seed-2.0-pro`) |
| `SCORE_THRESHOLD` | Minimum passing score 0-100 (default: `75`) |

## Architecture

```
User prompt
  → POST /api/pipeline (SSE)
      → Seedance 2.0: generate video
      → Seed 2.0 vision: evaluate → JSON scores
      → If score < threshold: Seed 2.0 text: repair prompt → repeat
  → Stream iterations to UI in real-time

Prompt suite
  → POST /api/suite/run (SSE)
      → For each benchmark prompt: generate 3 videos, score each
      → Compare avg score vs saved baseline → Pass/Fail
  → Full regression report
```
