<div align="center">

```
██████╗ ███████╗████████╗ █████╗ ██╗  ██╗███████╗
██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██║ ██╔╝██╔════╝
██████╔╝█████╗     ██║   ███████║█████╔╝ █████╗  
██╔══██╗██╔══╝     ██║   ██╔══██║██╔═██╗ ██╔══╝  
██║  ██║███████╗   ██║   ██║  ██║██║  ██╗███████╗
╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
```

**Self-healing video generation for developers who want to stop rerolling.**

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![BytePlus](https://img.shields.io/badge/BytePlus_Seedance-FF4500?style=for-the-badge&logo=bytedance&logoColor=white)](https://www.byteplus.com)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com)

</div>

---

## What is Retake?

Retake wraps BytePlus Seedance in a self-healing feedback loop. You write a prompt once. Retake generates a video, scores it with Seed 2.0 vision across three dimensions, and — if the score falls below your threshold — rewrites the prompt around the specific failures and tries again. Up to three takes, no human in the loop.

It also ships a prompt CI/CD suite: define benchmark prompts, run them before every template change, and get a clean pass/fail report against a saved baseline.

Built for the **BytePlus Seedance Hackathon 2026 · Track 3: AI DevTools for Video**.

---

## Features

**Self-Healing Playground**
Enter a prompt and watch the agent work. Seedance generates the video, Seed 2.0 scores it across prompt adherence, temporal consistency, and physical logic. Below threshold? The healer rewrites the prompt with the failure in mind and retakes. You get the best video and the full iteration history.

**Prompt CI/CD Suite**
Define a set of benchmark prompts with pass thresholds. Run the suite before any template change. Retake scores each prompt, compares against your saved baseline, and reports regressions with exact score deltas.

**Batch Mode**
Paste twenty prompts. Walk away. Retake runs two concurrently, streams into a live grid, and hands you a CSV when done.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, webpack) |
| Language | TypeScript strict mode |
| UI | shadcn/ui + Tailwind CSS, dark-first |
| Auth + Database | Supabase (PostgreSQL + row-level security) |
| Video generation | BytePlus Seedance 2.0 (T2V, 720p, 24fps) |
| Evaluation + healing | BytePlus Seed 2.0 (vision scoring + text repair) |
| Streaming | Server-Sent Events for real-time pipeline progress |

---

## Quick Start

```bash
git clone <repo-url>
cd retake
npm install
cp .env.local.example .env.local
# Fill in your API keys (see Environment Variables below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

| Variable | Description | Required |
|---|---|---|
| `BYTEPLUS_API_KEY` | BytePlus ModelArk API key | Yes |
| `BYTEPLUS_API_BASE` | API base URL | Yes |
| `SEEDANCE_MODEL` | Seedance model ID | Yes |
| `SEED2_VISION_MODEL` | Seed 2.0 vision model ID | Yes |
| `SEED2_TEXT_MODEL` | Seed 2.0 text model ID | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) | Yes |
| `SCORE_THRESHOLD` | Minimum passing score 0–100 (default: 75) | No |

---

## Database Setup

Run the following SQL in your Supabase SQL editor:

```sql
-- Generations table
create table generations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  prompt      text not null,
  status      text not null default 'pending',
  best_score  numeric,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Iterations table
create table iterations (
  id             uuid primary key default gen_random_uuid(),
  generation_id  uuid not null references generations(id) on delete cascade,
  iteration_num  integer not null,
  prompt         text not null,
  video_url      text,
  scores         jsonb,
  healed         boolean not null default false,
  user_remarks   text,
  accepted       boolean not null default false,
  created_at     timestamptz not null default now()
);

-- Row-level security
alter table generations enable row level security;
alter table iterations enable row level security;

create policy "users own generations"
  on generations for all using (auth.uid() = user_id);

create policy "users own iterations"
  on iterations for all using (
    generation_id in (select id from generations where user_id = auth.uid())
  );
```

---

## Architecture

```
User prompt
  → POST /api/pipeline  (SSE)
      → Seedance 2.0: generate video (~38s)
      → Seed 2.0 vision: evaluate frames → JSON scores
      → If score < threshold:
          → Seed 2.0 text: repair prompt
          → Seedance 2.0: regenerate
          → Repeat up to 3 iterations
  → Stream each iteration to UI in real-time

Prompt CI/CD suite
  → POST /api/suite/run  (SSE)
      → For each benchmark prompt:
          → Generate 3 videos in parallel
          → Score each with Seed 2.0
          → Average scores → compare vs saved baseline
      → Pass if all prompts meet threshold
  → Full regression report with score deltas

Landing page videos
  → GET /api/landing-videos
      → Reads .landing-video-cache.json (gitignored)
      → Missing slots: fire-and-forget background generation
      → Client polls every 8s; shader placeholders show until ready
      → Zero bandwidth cost — URLs point directly to Seedance CDN
```

---

## Evaluation Dimensions

Every video is scored 0–100 across three axes by Seed 2.0:

**Prompt Adherence** — Does the video match what was described? Checks subject, setting, action, and style.

**Temporal Consistency** — Does the video hold together across time? No flickering subjects, no teleporting objects, no sudden scene cuts.

**Physical Logic** — Do objects behave like they should? Gravity, collisions, fluid motion, material behavior.

The healer receives the scores and failure reasons, then rewrites the prompt to explicitly anchor the failing dimensions before the next take.

---

## Project Structure

```
app/
├── api/
│   ├── pipeline/route.ts         # SSE self-healing loop
│   ├── suite/run/route.ts        # SSE benchmark suite runner
│   ├── generate/route.ts         # Seedance T2V wrapper
│   ├── evaluate/route.ts         # Seed 2.0 vision evaluator
│   ├── heal/route.ts             # Seed 2.0 prompt healer
│   ├── batch/route.ts            # Batch generation runner
│   ├── landing-videos/route.ts   # Landing page video cache
│   └── generations/              # CRUD for saved runs
├── dashboard/
│   ├── page.tsx                  # Playground
│   ├── batch/page.tsx            # Batch mode
│   ├── suite/page.tsx            # CI Suite
│   └── history/page.tsx          # Past runs
├── auth/
│   ├── login/page.tsx
│   └── register/page.tsx
└── page.tsx                      # Landing page

lib/
├── seedance.ts                   # BytePlus Seedance client
├── seed2.ts                      # BytePlus Seed 2.0 client
├── pipeline.ts                   # Self-healing orchestration
├── suite.ts                      # Suite runner
├── supabase.ts                   # Supabase client helpers
└── auth.ts                       # Session helpers

components/
├── HeroDemo.tsx                  # Landing page demo widget
├── Sidebar.tsx                   # Dashboard navigation
├── PipelineProgress.tsx          # SSE consumer + iteration cards
├── IterationCard.tsx             # Per-iteration result card
└── ScoreCard.tsx                 # Score bar visualization
```

---

<div align="center">

Built with Seedance 2.0 + Seed 2.0 · BytePlus Hackathon 2026

</div>
