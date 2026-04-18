"use client";

import { useState, useEffect, useRef } from "react";

/** Subset of VideoMap from the landing page — only the two hero slots we use. */
export interface HeroDemoVideos {
  hero_v1?: string;
  hero_v2?: string;
}

const PROMPT_1 = "A cyberpunk owl landing on a Tokyo rooftop, rain reflecting neon";
const PROMPT_2 =
  "A cyberpunk owl gliding onto a wet Tokyo rooftop at night, feathers catching pink and teal neon reflected in puddles, 24fps cinematic";

function Shader({
  variant = "warm",
  caption,
  aspect = "16 / 9",
  generatingLabel,
}: {
  variant?: "warm" | "cool" | "green" | "purple";
  caption?: string;
  aspect?: string;
  generatingLabel?: string;
}) {
  return (
    <div className={`shader shader-${variant}`} style={{ aspectRatio: aspect }}>
      <div className="shader-frame-overlay" />
      {generatingLabel && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            backdropFilter: "blur(2px)",
            borderRadius: 10,
            display: "grid",
            placeItems: "center",
            zIndex: 4,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "#fff",
              background: "rgba(0,0,0,0.7)",
              padding: "6px 12px",
              borderRadius: 4,
            }}
          >
            {generatingLabel}
          </div>
        </div>
      )}
      {caption && <div className="shader-label">{caption}</div>}
    </div>
  );
}

/**
 * Shows a shader placeholder until a real video URL is ready, then crossfades
 * to the actual <video> element. Uses preload="none" so the video bytes are
 * not fetched until the URL arrives and we render the element.
 */
function VideoSlot({
  url,
  variant,
  caption,
  generatingLabel,
  aspect = "16 / 9",
}: {
  url?: string;
  variant?: "warm" | "cool" | "green" | "purple";
  caption?: string;
  generatingLabel?: string;
  aspect?: string;
}) {
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // When url becomes available, reset readiness so the transition fires
  useEffect(() => {
    setVideoReady(false);
  }, [url]);

  return (
    <div style={{ position: "relative", aspectRatio: aspect, borderRadius: 10, overflow: "hidden" }}>
      {/* Shader layer — fades out once video is ready */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transition: "opacity 600ms ease",
          opacity: videoReady ? 0 : 1,
          pointerEvents: videoReady ? "none" : "auto",
          zIndex: 1,
        }}
      >
        <Shader variant={variant} caption={!videoReady ? caption : undefined} generatingLabel={generatingLabel} aspect={aspect} />
      </div>

      {/* Real video layer — only rendered when URL is available */}
      {url && (
        <video
          ref={videoRef}
          src={url}
          preload="none"
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 10,
            transition: "opacity 600ms ease",
            opacity: videoReady ? 1 : 0,
            zIndex: 2,
          }}
        />
      )}

      {/* Caption on top of real video */}
      {videoReady && caption && (
        <div className="shader-label" style={{ zIndex: 3 }}>{caption}</div>
      )}
    </div>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-row">
      <div className="label">{label}</div>
      <div className="score-bar">
        <div className="score-bar-fill" style={{ width: `${value * 10}%` }} />
      </div>
      <div className="score-value">{value > 0 ? value.toFixed(1) : "—"}</div>
    </div>
  );
}

function StepChip({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderRadius: 999,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        background: active
          ? "color-mix(in oklch, var(--rt-accent) 12%, transparent)"
          : done
          ? "color-mix(in oklch, var(--rt-ok) 10%, transparent)"
          : "var(--bg-2)",
        color: active
          ? "var(--rt-accent)"
          : done
          ? "var(--rt-ok)"
          : "var(--fg-3)",
        border: `1px solid ${
          active
            ? "color-mix(in oklch, var(--rt-accent) 40%, transparent)"
            : done
            ? "color-mix(in oklch, var(--rt-ok) 30%, transparent)"
            : "var(--line)"
        }`,
        transition: "all 240ms var(--ease-out)",
        whiteSpace: "nowrap" as const,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "currentColor",
          flexShrink: 0,
          animation: active ? "pulse-dot 1.4s ease-in-out infinite" : "none",
        }}
      />
      {label}
    </div>
  );
}

export function HeroDemo({ videos }: { videos?: HeroDemoVideos }) {
  const [phase, setPhase] = useState(0);
  const [typed, setTyped] = useState("");
  const [typed2, setTyped2] = useState("");
  const [scores1, setScores1] = useState([0, 0, 0]);
  const [scores2, setScores2] = useState([0, 0, 0]);

  useEffect(() => {
    let cancelled = false;
    const delay = (ms: number) =>
      new Promise<void>((r) => setTimeout(r, ms));

    const run = async () => {
      while (!cancelled) {
        setPhase(0);
        setTyped("");
        setTyped2("");
        setScores1([0, 0, 0]);
        setScores2([0, 0, 0]);

        for (let i = 1; i <= PROMPT_1.length; i++) {
          if (cancelled) return;
          setTyped(PROMPT_1.slice(0, i));
          await delay(28);
        }
        await delay(500);

        setPhase(1);
        await delay(2400);

        setPhase(2);
        setScores1([8.2, 6.4, 4.3]);
        await delay(1800);

        setPhase(3);
        await delay(500);
        for (let i = 1; i <= PROMPT_2.length; i++) {
          if (cancelled) return;
          setTyped2(PROMPT_2.slice(0, i));
          await delay(14);
        }
        await delay(400);

        setPhase(4);
        await delay(2200);

        setPhase(5);
        setScores2([9.1, 8.7, 8.9]);
        await delay(4200);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const statusText = [
    "composing prompt…",
    "seedance · generating frame 14/120",
    "seed 2.0 · scoring",
    "healer · rewriting prompt",
    "seedance · generating frame 72/120",
    "retake complete — 9.1 avg ↑ from 6.3",
  ][phase];

  return (
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid var(--line)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderBottom: "1px solid var(--line)",
          background: "color-mix(in oklch, var(--bg) 50%, var(--bg-1))",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["oklch(0.68 0.2 25)", "oklch(0.85 0.17 85)", "oklch(0.72 0.17 150)"].map(
            (c) => (
              <div
                key={c}
                style={{ width: 10, height: 10, borderRadius: "50%", background: c }}
              />
            )
          )}
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--fg-3)",
          }}
        >
          retake · playground — autonomous mode
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StepChip
            label="generate"
            active={phase === 1 || phase === 4}
            done={phase > 1 && phase !== 4}
          />
          <StepChip label="score" active={phase === 2} done={phase > 2} />
          <StepChip label="heal" active={phase === 3} done={phase > 3} />
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: 400,
        }}
      >
        {/* Left: prompt editor */}
        <div
          style={{
            padding: 24,
            borderRight: "1px solid var(--line)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div className="eyebrow">Prompt · iter_01</div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              lineHeight: 1.6,
              minHeight: 72,
              color: "var(--fg)",
            }}
          >
            {typed}
            {phase === 0 && <span className="caret" />}
          </div>

          {phase >= 3 && (
            <>
              <div className="eyebrow fade-in" style={{ marginTop: 8 }}>
                Prompt · iter_02{" "}
                <span style={{ color: "var(--rt-accent)" }}>· healed</span>
              </div>
              <div
                className="fade-in"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--fg)",
                  padding: 12,
                  background:
                    "color-mix(in oklch, var(--rt-accent) 7%, transparent)",
                  borderRadius: 10,
                  border:
                    "1px solid color-mix(in oklch, var(--rt-accent) 25%, var(--line))",
                }}
              >
                {typed2}
                {phase === 3 && typed2.length < PROMPT_2.length && (
                  <span className="caret" />
                )}
              </div>
              <div
                className="fade-in"
                style={{
                  fontSize: 12,
                  color: "var(--fg-2)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <span style={{ color: "var(--fg-3)" }}>diagnosis →</span>{" "}
                temporal drift on feathers, rain physics missing
              </div>
            </>
          )}

          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              paddingTop: 12,
              borderTop: "1px solid var(--line)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--fg-3)",
                flex: 1,
              }}
            >
              {statusText}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: phase === 5 ? "var(--rt-ok)" : "var(--rt-accent)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "currentColor",
                  animation:
                    phase !== 5 ? "pulse-dot 1.4s ease-in-out infinite" : "none",
                }}
              />
              {phase === 5 ? "done" : "live"}
            </div>
          </div>
        </div>

        {/* Right: videos + scores */}
        <div
          style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
        >
          <VideoSlot
            url={videos?.hero_v1}
            variant="cool"
            caption="iter_01 · attempt"
            generatingLabel={phase === 1 ? "generating · 14/120" : undefined}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <ScoreRow label="Prompt fit" value={scores1[0]} />
            <ScoreRow label="Temporal" value={scores1[1]} />
            <ScoreRow label="Physics" value={scores1[2]} />
          </div>

          {phase >= 4 && (
            <div className="fade-up">
              <div
                style={{ height: 1, background: "var(--line)", margin: "4px 0" }}
              />
              <VideoSlot
                url={videos?.hero_v2}
                variant="warm"
                caption="iter_02 · retaken"
                generatingLabel={
                  phase === 4 ? "generating · 72/120" : undefined
                }
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <ScoreRow label="Prompt fit" value={scores2[0]} />
                <ScoreRow label="Temporal" value={scores2[1]} />
                <ScoreRow label="Physics" value={scores2[2]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
