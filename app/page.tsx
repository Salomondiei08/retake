"use client";

import Link from "next/link";
import { HeroDemo } from "@/components/HeroDemo";
import { useEffect, useRef, useState, type CSSProperties } from "react";

/* ── Scroll-triggered animation hook ───────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ── Animated wrapper — fades + slides up when scrolled into view ── */
function Reveal({
  children, delay = 0, style, from = "bottom",
}: {
  children: React.ReactNode;
  delay?: number;
  style?: CSSProperties;
  from?: "bottom" | "left" | "right";
}) {
  const { ref, inView } = useInView();
  const translate =
    from === "left" ? "translateX(-32px)" :
    from === "right" ? "translateX(32px)" :
    "translateY(28px)";

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translate(0,0)" : translate,
        transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Static shader placeholder ──────────────────────────────── */
function Shader({
  variant = "warm", aspect = "16 / 9", caption,
}: {
  variant?: "warm" | "cool" | "green" | "purple";
  aspect?: string;
  caption?: string;
}) {
  return (
    <div className={`shader shader-${variant}`} style={{ aspectRatio: aspect }}>
      <div className="shader-frame-overlay" />
      {caption && <div className="shader-label">{caption}</div>}
    </div>
  );
}

/* ── Hover card wrapper ─────────────────────────────────────── */
function HoverCard({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...style,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px var(--line-strong)" : undefined,
        transition: "transform 260ms cubic-bezier(0.22,1,0.36,1), box-shadow 260ms cubic-bezier(0.22,1,0.36,1), border-color 260ms",
      }}
    >
      {children}
    </div>
  );
}

/* ── Navigation ─────────────────────────────────────────────── */
function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "18px 40px",
      backdropFilter: "blur(14px)",
      background: "color-mix(in oklch, var(--bg) 80%, transparent)",
      borderBottom: `1px solid ${scrolled ? "var(--line)" : "var(--line-soft)"}`,
      transition: "border-color 300ms",
    }}>
      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
        <span className="logo-mark" style={{ width: 24, height: 24, fontSize: 13 }}>R</span>
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em", color: "var(--fg)" }}>
          Retake
        </span>
      </Link>

      <div style={{ display: "flex", gap: 24, fontSize: 13, color: "var(--fg-1)", fontWeight: 500 }}>
        {[["How it works", "#how"], ["Features", "#features"], ["Tech", "#tech"]].map(([label, href]) => (
          <a key={href} href={href} style={{ transition: "color 140ms" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-1)")}
          >{label}</a>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Link href="/auth/login" style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid var(--line)", color: "var(--fg)", transition: "background 160ms, border-color 160ms" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          Log in
        </Link>
        <Link href="/auth/register" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--rt-accent)", color: "#fff", transition: "background 160ms, transform 160ms" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--rt-accent-hover)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--rt-accent)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
        >
          Get started
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </nav>
  );
}

/* ── Landing page ───────────────────────────────────────────── */
export default function LandingPage() {
  // Hero entrance — triggers on mount after a short frame delay
  const [heroIn, setHeroIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setTimeout(() => setHeroIn(true), 60));
    return () => cancelAnimationFrame(t);
  }, []);

  const heroStyle = (delay: number): CSSProperties => ({
    opacity: heroIn ? 1 : 0,
    transform: heroIn ? "translateY(0)" : "translateY(24px)",
    transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
  });

  return (
    <div className="grain" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 0 0", position: "relative", overflow: "hidden" }}>
        {/* Ambient glow — pulsing */}
        <div style={{
          position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)",
          width: 900, height: 600, pointerEvents: "none",
          background: "radial-gradient(ellipse, var(--rt-accent-glow) 0%, transparent 60%)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px", position: "relative", zIndex: 1 }}>
          {/* Eyebrow pill */}
          <div style={{ ...heroStyle(0), display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 8px", borderRadius: 999, border: "1px solid var(--line)", background: "var(--bg-1)", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-1)" }}>
            <span style={{ background: "var(--rt-accent)", color: "#fff", padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600 }}>v0.4</span>
            Seedance + Seed 2.0, wired into a loop
          </div>

          {/* Title */}
          <h1 style={{ ...heroStyle(80), fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(48px, 7vw, 100px)", lineHeight: 0.96, letterSpacing: "-0.035em", margin: "28px 0 0", color: "var(--fg)" }}>
            Stop guessing.<br />
            Start{" "}
            <span style={{ background: "var(--fg)", color: "var(--bg)", padding: "0 0.18em", borderRadius: 6 }}>
              retaking.
            </span>
          </h1>

          <p style={{ ...heroStyle(160), fontSize: "clamp(16px, 1.4vw, 19px)", color: "var(--fg-1)", maxWidth: "52ch", lineHeight: 1.6, margin: "28px 0 36px" }}>
            Retake wraps BytePlus Seedance in a self-healing feedback loop. Generate a video, score it, and if it fails — rewrite the prompt and try again. Up to three takes, no human in the loop.
          </p>

          <div style={{ ...heroStyle(240), display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/auth/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 10, fontSize: 16, fontWeight: 600, background: "var(--rt-accent)", color: "#fff", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)", transition: "background 160ms, transform 160ms, box-shadow 160ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--rt-accent-hover)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.02)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--rt-accent)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
            >
              Get started — free
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
            <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 10, fontSize: 16, fontWeight: 500, border: "1px solid var(--line)", color: "var(--fg)", transition: "background 160ms, border-color 160ms" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              Open playground
            </Link>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>
              no credit card · 50 retakes free
            </span>
          </div>

          {/* Animated hero demo */}
          <div style={{ ...heroStyle(360), marginTop: 64 }}>
            <HeroDemo />
          </div>
        </div>

        {/* Marquee band */}
        <div style={{ padding: "20px 0", borderTop: "1px solid var(--line-soft)", borderBottom: "1px solid var(--line-soft)", marginTop: 80 }}>
          <div className="marquee-outer">
            <div className="marquee-track">
              {[0, 1].map((j) => (
                <div key={j} style={{ display: "flex", gap: 64, fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-2)" }}>
                  {["self-healing prompts","CI for video models","batched retakes","3-dim scoring","BytePlus Seedance","Seed 2.0 eval","regression baselines","parallel generation"].map((t) => (
                    <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                      <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--rt-accent)", flexShrink: 0 }} />
                      {t}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Problems ─────────────────────────────────────── */}
      <section id="problems" style={{ padding: "120px 0", borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, gap: 40, flexWrap: "wrap" }}>
            <Reveal>
              <div>
                <div className="eyebrow">The two problems</div>
                <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(34px, 4vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: "8px 0 0", maxWidth: "16ch", color: "var(--fg)" }}>
                  Video AI is a slot machine.{" "}
                  <span style={{ color: "var(--rt-accent)" }}>Retake</span> makes it a lathe.
                </h2>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <p style={{ color: "var(--fg-2)", maxWidth: "36ch", fontSize: 16, lineHeight: 1.6 }}>
                Two failure modes, one loop. A feedback signal where there was silence, and a regression net where there was none.
              </p>
            </Reveal>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { num: "01 / slot machine", emoji: "⚙ → 🎲 → ?", h: "You prompt, it generates, you have no idea why it failed.", p: "Today's video models are black boxes. Bad physics? Temporal jitter? Wrong subject? You get a video — not a reason. So you reroll, reword, and hope.", tag: "Retake scores every frame" },
              { num: "02 / regression", emoji: "v1.0 ✓  →  v1.1 ✗", h: "The prompt that worked yesterday silently breaks today.", p: "Change a system prompt, swap a template, upgrade a model — and a dozen workflows regress without warning. There's no git blame for video quality.", tag: "Retake is CI for prompts" },
            ].map((card, i) => (
              <Reveal key={card.num} delay={i * 120}>
                <HoverCard style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, padding: 36, position: "relative", height: "100%" }}>
                  <div style={{ position: "absolute", top: 24, right: 28, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{card.num}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, color: "var(--rt-accent)", letterSpacing: "-0.02em", marginTop: 8 }}>{card.emoji}</div>
                  <h3 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", margin: "28px 0 12px", maxWidth: "18ch", color: "var(--fg)", lineHeight: 1.2 }}>{card.h}</h3>
                  <p style={{ color: "var(--fg-2)", lineHeight: 1.6, fontSize: 15, maxWidth: "44ch" }}>{card.p}</p>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 20, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--rt-accent)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", animation: "pulse-dot 1.4s ease-in-out infinite" }} />
                    {card.tag}
                  </div>
                </HoverCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how" style={{ padding: "120px 0", borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, gap: 40, flexWrap: "wrap" }}>
            <Reveal>
              <div>
                <div className="eyebrow">The loop</div>
                <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(34px, 4vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: "8px 0 0", color: "var(--fg)" }}>
                  Generate. Score. <span style={{ color: "var(--rt-accent)" }}>Heal.</span> Retake.
                </h2>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <p style={{ color: "var(--fg-2)", maxWidth: "36ch", fontSize: 16, lineHeight: 1.6 }}>
                A single prompt becomes up to three takes, each informed by the score of the last.
              </p>
            </Reveal>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              { n: "01", h: "Prompt", p: "You write it once. Retake treats it as a seed, not a spell.", icon: "terminal" },
              { n: "02", h: "Generate", p: "Seedance renders your video at 720p, 5 seconds, 24fps.", icon: "play" },
              { n: "03", h: "Score", p: "Seed 2.0 grades it across prompt fit, temporal, and physics.", icon: "eye" },
              { n: "04", h: "Retake", p: "Below threshold? Prompt rewritten with the failure in mind, regenerated.", icon: "refresh" },
            ].map((step, i) => (
              <Reveal key={step.n} delay={i * 80}>
                <HoverCard style={{ padding: "28px 24px", border: "1px solid var(--line)", borderRadius: 16, background: "var(--bg-1)", position: "relative", overflow: "hidden", height: "100%" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.14em" }}>{step.n}</div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--rt-accent)", margin: "16px 0" }}>
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                      {i === 0 && <><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></>}
                      {i === 1 && <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="currentColor"/>}
                      {i === 2 && <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                      {i === 3 && <><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>}
                    </svg>
                  </div>
                  <h4 style={{ fontSize: 17, fontWeight: 500, margin: "0 0 8px", color: "var(--fg)" }}>{step.h}</h4>
                  <p style={{ fontSize: 13, color: "var(--fg-2)", margin: 0, lineHeight: 1.55 }}>{step.p}</p>
                  {i < 3 && (
                    <div style={{ position: "absolute", top: "50%", right: -9, transform: "translateY(-50%)", zIndex: 2, background: "var(--bg)", padding: 4, color: "var(--fg-3)" }}>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                    </div>
                  )}
                </HoverCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" style={{ padding: "120px 0", borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>

          {/* Feature 1: Playground */}
          <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 56, alignItems: "center", marginBottom: 120 }}>
            <Reveal from="left">
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)" }}>01</div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(26px, 2.8vw, 42px)", lineHeight: 1.1, margin: "14px 0 16px", letterSpacing: "-0.02em", color: "var(--fg)" }}>
                  A playground that talks back.
                </h3>
                <p style={{ color: "var(--fg-1)", fontSize: 16, lineHeight: 1.6, maxWidth: "44ch", marginBottom: 24 }}>
                  Interactive mode gives you the steering wheel — see every score, add a remark, decide whether to heal. Autonomous mode runs the whole loop and streams progress live.
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
                  {["Three-dimensional scoring on every take", "Inline preview of the healed prompt", "Add personal remarks before a retake", "Cancel autonomous runs mid-stream"].map((b) => (
                    <li key={b} style={{ listStyle: "none", display: "flex", gap: 12, alignItems: "flex-start", color: "var(--fg-2)", fontSize: 14 }}>
                      <span style={{ color: "var(--rt-accent)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>→</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal from="right" delay={80}>
              <HoverCard style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, padding: 28, minHeight: 360 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20, alignItems: "center" }}>
                  <div className="rt-tabs">
                    <button className="rt-tab active">Interactive</button>
                    <button className="rt-tab">Autonomous</button>
                  </div>
                  <span className="chip chip-accent"><span className="chip-dot pulse" />running</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    { v: "cool" as const, caption: "iter_01 · 6.3", scores: [[82,"Prompt"],[64,"Temporal"],[43,"Physics"]] },
                    { v: "warm" as const, caption: "iter_02 · 8.9 ✓", scores: [[91,"Prompt"],[87,"Temporal"],[89,"Physics"]] },
                  ].map(({ v, caption, scores }) => (
                    <div key={caption}>
                      <Shader variant={v} caption={caption} aspect="16 / 10" />
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                        {scores.map(([pct, label]) => (
                          <div key={label} className="score-row">
                            <div className="label">{label}</div>
                            <div className="score-bar"><div className="score-bar-fill" style={{ width: `${pct}%` }} /></div>
                            <div className="score-value">{(Number(pct) / 10).toFixed(1)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: 12, background: "var(--bg-2)", borderRadius: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)" }}>
                  <span style={{ color: "var(--rt-accent)" }}>healer →</span> added &quot;rain on glass&quot; + &quot;24fps&quot; · temporal coherence restored
                </div>
              </HoverCard>
            </Reveal>
          </div>

          {/* Feature 2: CI Suite */}
          <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 56, alignItems: "center", marginBottom: 120 }}>
            <Reveal from="left">
              <HoverCard style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)" }}>benchmark_v4.yaml · 12 prompts</div>
                  <span className="chip chip-ok"><span className="chip-dot" />11/12 pass</span>
                </div>
                <div style={{ border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
                  {[
                    { p: "cyberpunk owl, rain, neon", old: 7.2, nw: 8.9, pass: true },
                    { p: "astronaut gardening on mars", old: 6.8, nw: 7.4, pass: true },
                    { p: "candle in hurricane wind", old: 8.1, nw: 8.3, pass: true },
                    { p: "marble rolling uphill, slow-mo", old: 7.9, nw: 5.2, pass: false },
                    { p: "golden retriever skateboarding", old: 8.3, nw: 9.1, pass: true },
                  ].map((r, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 56px", padding: "10px 14px", borderTop: i ? "1px solid var(--line-soft)" : "none", fontFamily: "var(--font-mono)", fontSize: 12, alignItems: "center", gap: 8 }}>
                      <div style={{ color: "var(--fg-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.p}</div>
                      <div style={{ color: "var(--fg-3)" }}>{r.old.toFixed(1)}</div>
                      <div style={{ color: "var(--fg)" }}>{r.nw.toFixed(1)}</div>
                      <div style={{ color: r.pass ? "var(--rt-ok)" : "var(--rt-fail)", fontSize: 11 }}>
                        {r.pass ? `✓ +${(r.nw - r.old).toFixed(1)}` : `✗ ${(r.nw - r.old).toFixed(1)}`}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                  <button style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "var(--rt-accent)", color: "#fff", cursor: "pointer" }}>Save as baseline</button>
                  <button style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, border: "1px solid var(--line)", color: "var(--fg)", background: "transparent", cursor: "pointer" }}>Diff vs v3</button>
                </div>
              </HoverCard>
            </Reveal>
            <Reveal from="right" delay={80}>
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)" }}>02</div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(26px, 2.8vw, 42px)", lineHeight: 1.1, margin: "14px 0 16px", letterSpacing: "-0.02em", color: "var(--fg)" }}>
                  CI for your prompts.
                </h3>
                <p style={{ color: "var(--fg-1)", fontSize: 16, lineHeight: 1.6, maxWidth: "44ch", marginBottom: 24 }}>
                  Define a suite of benchmark prompts and thresholds. Run them before every template change. Retake grades each one against a saved baseline and gives you a clean pass/fail.
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
                  {["Per-prompt score thresholds", "Baseline deltas with +/- indicators", "Suite passes only if every prompt passes", "Snapshot baselines on demand"].map((b) => (
                    <li key={b} style={{ listStyle: "none", display: "flex", gap: 12, alignItems: "flex-start", color: "var(--fg-2)", fontSize: 14 }}>
                      <span style={{ color: "var(--rt-accent)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>→</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>

          {/* Feature 3: Batch */}
          <div style={{ display: "grid", gridTemplateColumns: "5fr 7fr", gap: 56, alignItems: "center" }}>
            <Reveal from="left">
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)" }}>03</div>
                <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(26px, 2.8vw, 42px)", lineHeight: 1.1, margin: "14px 0 16px", letterSpacing: "-0.02em", color: "var(--fg)" }}>
                  Batch, in parallel, with the receipts.
                </h3>
                <p style={{ color: "var(--fg-1)", fontSize: 16, lineHeight: 1.6, maxWidth: "44ch", marginBottom: 24 }}>
                  Paste twenty prompts, walk away. Retake runs two concurrently, streams progress into a live grid, and hands you a CSV when done.
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10, padding: 0 }}>
                  {["CSV upload or one-per-line paste", "Live grid with status per card", "Two prompts running concurrently", "Export everything as CSV"].map((b) => (
                    <li key={b} style={{ listStyle: "none", display: "flex", gap: 12, alignItems: "flex-start", color: "var(--fg-2)", fontSize: 14 }}>
                      <span style={{ color: "var(--rt-accent)", fontFamily: "var(--font-mono)", flexShrink: 0 }}>→</span>{b}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal from="right" delay={80}>
              <HoverCard style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14, alignItems: "center" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)" }}>batch_2604 · 14 of 20 complete</div>
                  <span className="chip chip-accent"><span className="chip-dot pulse" />2 running</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {(["warm","cool","green","purple","warm","cool","green","warm"] as const).map((v, i) => (
                    <div key={i} style={{ position: "relative" }}>
                      <Shader variant={v} aspect="1 / 1" caption={`p_${String(i+1).padStart(2,"0")}`} />
                      <div style={{ position: "absolute", top: 6, right: 6, fontFamily: "var(--font-mono)", fontSize: 9, background: "rgba(0,0,0,0.7)", color: i < 5 ? "var(--rt-ok)" : i === 5 ? "var(--rt-accent)" : "rgba(255,255,255,0.5)", padding: "2px 5px", borderRadius: 3 }}>
                        {i < 5 ? `✓ ${(7.5+i*0.3).toFixed(1)}` : i === 5 ? "gen" : "…"}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, height: 6, background: "var(--bg-3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: "70%", height: "100%", background: "var(--rt-accent)", boxShadow: "0 0 10px var(--rt-accent-glow)" }} />
                </div>
                <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
                  <span>14 / 20</span><span>2:41 remaining</span>
                </div>
              </HoverCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Tech ─────────────────────────────────────────── */}
      <section id="tech" style={{ padding: "120px 0", borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 56, gap: 40, flexWrap: "wrap" }}>
            <Reveal>
              <div>
                <div className="eyebrow">The engine room</div>
                <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(34px, 4vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.025em", margin: "8px 0 0", color: "var(--fg)" }}>
                  Two models, <span style={{ color: "var(--rt-accent)" }}>one loop.</span>
                </h2>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <p style={{ color: "var(--fg-2)", maxWidth: "36ch", fontSize: 16, lineHeight: 1.6 }}>
                We didn&apos;t train a model — we orchestrated two of the best ones. Generation and evaluation in a choreographed handoff.
              </p>
            </Reveal>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { brand: "Generation", name: "BytePlus Seedance", desc: "State-of-the-art text-to-video. 720p, 5-second clips at 24fps. Retake handles prompt templating, parameter tuning, and retries.", specs: [["resolution","1280×720"],["duration","5s @ 24fps"],["avg gen time","38s"]] },
              { brand: "Evaluation", name: "Seed 2.0 Vision", desc: "A vision-language model that watches your video and scores it across prompt adherence, temporal consistency, and physical logic.", specs: [["dimensions","3"],["scale","0 — 100"],["avg eval time","4s"]] },
            ].map((card, i) => (
              <Reveal key={card.name} delay={i * 120}>
                <HoverCard style={{ padding: 36, border: "1px solid var(--line)", borderRadius: 16, background: "var(--bg-1)", height: "100%" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{card.brand}</div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: 28, margin: "12px 0 14px", letterSpacing: "-0.02em", color: "var(--fg)" }}>{card.name}</h3>
                  <p style={{ color: "var(--fg-2)", margin: 0, fontSize: 15, lineHeight: 1.6 }}>{card.desc}</p>
                  <div style={{ marginTop: 20, padding: 14, background: "var(--bg-2)", borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-2)", lineHeight: 1.9 }}>
                    {card.specs.map(([k, v]) => (
                      <div key={k}><span style={{ color: "var(--rt-accent)" }}>{k}</span>{"  "}{v}</div>
                    ))}
                  </div>
                </HoverCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mega CTA ─────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 40px 120px", textAlign: "center" }}>
          <Reveal>
            <div className="eyebrow">Ready to retake?</div>
          </Reveal>
          <Reveal delay={60}>
            <h2 style={{ fontFamily: "var(--font-sans)", fontWeight: 500, fontSize: "clamp(72px, 13vw, 210px)", lineHeight: 0.88, letterSpacing: "-0.04em", padding: "36px 0 20px", color: "var(--fg)" }}>
              Three<br />takes, <span style={{ color: "var(--rt-accent)" }}>one</span><br />that lands.
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <Link href="/auth/register" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 10, fontSize: 16, fontWeight: 600, background: "var(--rt-accent)", color: "#fff", transition: "background 160ms, transform 160ms" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--rt-accent-hover)"; (e.currentTarget as HTMLElement).style.transform = "scale(1.03)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "var(--rt-accent)"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
              >
                Create free account
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 10, fontSize: 16, fontWeight: 500, border: "1px solid var(--line)", color: "var(--fg)", transition: "background 160ms" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-2)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                Try the playground
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer style={{ padding: "60px 40px 40px", borderTop: "1px solid var(--line-soft)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 40, alignItems: "start" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span className="logo-mark" style={{ width: 22, height: 22, fontSize: 12 }}>R</span>
              <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 18, letterSpacing: "-0.02em" }}>Retake</span>
            </div>
            <p style={{ color: "var(--fg-2)", fontSize: 13, margin: "16px 0 0", maxWidth: "34ch", lineHeight: 1.6 }}>
              Self-healing video generation for developers who want to stop rerolling.
            </p>
            <div style={{ marginTop: 20, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
              © 2026 Retake Labs · built with Seedance + Seed 2.0
            </div>
          </div>

          {[
            { title: "Product", links: [["Playground","/dashboard"],["Batch","/dashboard/batch"],["CI Suite","/dashboard/suite"],["History","/dashboard/history"]] },
            { title: "Resources", links: [["Docs","#"],["API reference","#"],["Changelog","#"]] },
            { title: "Company", links: [["About","#"],["Blog","#"],["Contact","#"]] },
          ].map((col) => (
            <div key={col.title}>
              <h5 style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.14em", margin: "0 0 14px", fontWeight: 500 }}>{col.title}</h5>
              {col.links.map(([label, href]) => (
                <Link key={label} href={href} style={{ display: "block", padding: "4px 0", color: "var(--fg-1)", fontSize: 14, transition: "color 140ms" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--fg)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--fg-1)")}
                >{label}</Link>
              ))}
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
