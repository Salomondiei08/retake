import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Wand2,
  FlaskConical,
  ArrowRight,
  CheckCircle2,
  Play,
  GitBranch,
  Shield,
  TrendingUp,
  Code2,
} from "lucide-react";

const STATS = [
  { value: "3x", label: "Faster iteration" },
  { value: "75+", label: "Quality threshold" },
  { value: "Auto", label: "Self-healing" },
  { value: "0", label: "Manual retries" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Enter your prompt",
    description:
      "Describe the video you want. SeedTrace sends it to Seedance 2.0 for generation.",
    icon: Code2,
  },
  {
    step: "02",
    title: "Seed 2.0 evaluates",
    description:
      "The model watches the generated video and scores prompt adherence, temporal consistency, and physical logic.",
    icon: Shield,
  },
  {
    step: "03",
    title: "Agent heals and retries",
    description:
      "If the score falls below threshold, the agent diagnoses failures, rewrites the prompt, and regenerates automatically.",
    icon: Wand2,
  },
];

const FEATURES = [
  {
    icon: Wand2,
    title: "Self-Healing Playground",
    description:
      "Watch the agent generate, evaluate, and auto-repair video prompts in real time. Score improvements streamed live.",
  },
  {
    icon: FlaskConical,
    title: "Prompt CI/CD Suite",
    description:
      "Define benchmark prompts and run regression tests. Compare against saved baselines. Get Pass/Fail grades automatically.",
  },
  {
    icon: GitBranch,
    title: "Iteration History",
    description:
      "Every generation is captured with its score delta. See exactly how much the agent improved quality across iterations.",
  },
  {
    icon: TrendingUp,
    title: "Quality Scoring",
    description:
      "Three-axis evaluation: prompt adherence, temporal consistency, and physical logic — weighted into a single overall score.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-green-400" />
            </div>
            <span className="font-semibold text-sm tracking-tight">SeedTrace</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 hidden sm:block">
              Track 3 · AI DevTools for Video
            </span>
            <Link href="/dashboard">
              <Button size="sm" className="h-8 gap-1.5 bg-green-500 hover:bg-green-400 text-black font-semibold text-xs">
                Open App <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-4 flex flex-col items-center text-center">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 left-1/3 w-[300px] h-[300px] bg-green-500/3 rounded-full blur-2xl" />
        </div>

        {/* Badge */}
        <div className="relative inline-flex items-center gap-2 px-3 py-1 rounded-full border border-green-500/20 bg-green-500/5 text-green-400 text-xs font-medium mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
          BytePlus Seedance Hackathon · Track 3
        </div>

        {/* Headline */}
        <h1 className="relative max-w-3xl text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
          Video generation that{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-300">
            fixes itself
          </span>
        </h1>

        <p className="relative max-w-xl text-lg text-white/50 leading-relaxed mb-10">
          SeedTrace wraps Seedance 2.0 with an autonomous evaluate-and-repair loop.
          Bad output? The agent diagnoses it, rewrites the prompt, and tries again.
        </p>

        <div className="relative flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard">
            <Button className="h-11 px-6 gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold">
              <Play className="h-4 w-4" />
              Try the Playground
            </Button>
          </Link>
          <Link href="/dashboard/suite">
            <Button
              variant="outline"
              className="h-11 px-6 gap-2 border-white/10 bg-white/5 hover:bg-white/10 text-white"
            >
              <FlaskConical className="h-4 w-4" />
              Run CI Suite
            </Button>
          </Link>
        </div>

        {/* Demo preview mockup */}
        <div className="relative mt-16 w-full max-w-4xl">
          <div className="rounded-2xl border border-white/8 bg-[#111] overflow-hidden shadow-2xl shadow-black/60">
            {/* Window chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <div className="ml-3 flex-1 max-w-sm mx-auto h-5 rounded bg-white/5 flex items-center justify-center">
                <span className="text-xs text-white/30">localhost:3000/dashboard</span>
              </div>
            </div>
            {/* Fake UI preview */}
            <div className="p-6 grid grid-cols-3 gap-4 min-h-[280px]">
              {/* Left: input area */}
              <div className="col-span-1 space-y-3">
                <div className="h-4 w-24 rounded bg-white/10" />
                <div className="rounded-lg border border-white/10 bg-white/3 p-3 space-y-2">
                  <div className="h-2 w-full rounded bg-white/8" />
                  <div className="h-2 w-4/5 rounded bg-white/8" />
                  <div className="h-2 w-3/5 rounded bg-white/8" />
                </div>
                <div className="h-9 w-full rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  <div className="h-2 w-20 rounded bg-green-400/60" />
                </div>
              </div>

              {/* Right: iteration cards */}
              <div className="col-span-2 grid grid-cols-2 gap-3">
                {[
                  { score: 58, label: "Iteration 1", healed: false },
                  { score: 81, label: "Iteration 2 · Healed", healed: true },
                ].map((card) => (
                  <div
                    key={card.label}
                    className={`rounded-xl border p-3 space-y-3 ${
                      card.healed
                        ? "border-green-500/30 bg-green-500/5"
                        : "border-white/8 bg-white/3"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-2 w-16 rounded bg-white/20" />
                      <div
                        className={`h-5 w-12 rounded text-xs flex items-center justify-center font-mono font-bold ${
                          card.healed ? "text-green-400" : "text-yellow-400"
                        }`}
                      >
                        {card.score}
                      </div>
                    </div>
                    <div className="aspect-video rounded-md bg-white/5 border border-white/8 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white/20" />
                    </div>
                    <div className="space-y-1.5">
                      {[100, 75, 90].map((w, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <div className="h-1 rounded-full bg-white/10" style={{ width: "60px" }} />
                          <div
                            className={`h-1 rounded-full ${card.healed ? "bg-green-500/50" : "bg-yellow-500/40"}`}
                            style={{ width: `${w * 0.6}px` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Bottom glow */}
          <div className="absolute -bottom-4 inset-x-8 h-16 bg-green-500/10 blur-2xl rounded-full" />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-y border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">{s.value}</div>
              <div className="text-sm text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-medium mb-3">How it works</p>
            <h2 className="text-3xl font-bold">From prompt to passing score</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="relative">
                  <div className="text-5xl font-bold text-white/5 mb-4 font-mono">
                    {step.step}
                  </div>
                  <div className="h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-4 w-4 text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-green-400 text-sm font-medium mb-3">Features</p>
            <h2 className="text-3xl font-bold">Everything you need to ship reliable video</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl border border-white/8 bg-white/2 hover:bg-white/4 hover:border-white/12 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                    <Icon className="h-4 w-4 text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tech stack */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-white/30 mb-6 uppercase tracking-widest">Powered by</p>
          <div className="flex flex-wrap justify-center gap-3">
            {["Seedance 2.0", "Seed 2.0 Vision", "Seedream 5.0", "Seed Speech", "SSE Streaming"].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 rounded-full border border-white/8 bg-white/3 text-sm text-white/60"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Start generating better videos</h2>
          <p className="text-white/50 mb-8">
            Open the playground, enter a prompt, and watch SeedTrace work.
          </p>
          <Link href="/dashboard">
            <Button className="h-12 px-8 gap-2 bg-green-500 hover:bg-green-400 text-black font-semibold text-base">
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/30">
            {["BytePlus API required", "No credit card", "Open source"].map((item, i) => (
              <span key={item} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-white/15">·</span>}
                <CheckCircle2 className="h-3 w-3" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-green-500/50" />
            <span>SeedTrace — BytePlus Seedance Hackathon 2026</span>
          </div>
          <span>Track 3: AI DevTools for Video</span>
        </div>
      </footer>
    </div>
  );
}
