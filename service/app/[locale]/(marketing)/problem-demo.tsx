"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";

type Demo = {
  promptLabel: string;
  prompt: string;
  cloning: string;
  cloned: string;
  blockedLabel: string;
  blocked: string;
};

type Phase = "type" | "cloning" | "cloned" | "arm" | "gate" | "blocked";

/**
 * The problem-section centrepiece: a looping, CSS-driven story.
 *
 *   Without POCX:  screenshot → agent prompt → "cloning…" → your idea, cloned
 *   With POCX:     same prompt → an ink gate drops → "Access denied"
 *
 * A minimal state machine advances `phase`; the actual motion is CSS
 * transitions keyed off `data-phase` (see globals.css). The typed prompt
 * width is animated in JS so the caret rides the true end of the text.
 *
 * `prefers-reduced-motion` swaps the whole thing for a static side-by-side
 * comparison (cloned vs blocked) — no motion, same message.
 */

// Phase → dwell time before advancing (ms). Sums to the loop length.
const TIMELINE: Array<[Phase, number]> = [
  ["type", 2200],
  ["cloning", 1400],
  ["cloned", 2000],
  ["arm", 1400],
  ["gate", 1200],
  ["blocked", 2600],
];

export function ProblemDemo({ demo }: { demo: Demo }) {
  const [reduced, setReduced] = useState(false);
  const [phase, setPhase] = useState<Phase>("type");
  const [typed, setTyped] = useState(0); // 0–100 (% of prompt revealed)
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Honour reduced-motion, and react if the user flips the setting.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // The phase clock: advance through TIMELINE and loop.
  useEffect(() => {
    if (reduced) return;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const [current] = TIMELINE[i];
      setPhase(current);
      const [, dwell] = TIMELINE[i];
      i = (i + 1) % TIMELINE.length;
      timer = setTimeout(tick, dwell);
    };
    tick();
    return () => clearTimeout(timer);
  }, [reduced]);

  // Type the prompt out while in the "type"/"arm" phases; instant-full
  // once cloning starts so the caret doesn't lag the story.
  useEffect(() => {
    if (reduced) return;
    if (phase === "type" || phase === "arm") {
      setTyped(0);
      let raf = 0;
      const start = performance.now();
      const dur = 1300;
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        setTyped(p * 100);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    }
    setTyped(100);
  }, [phase, reduced]);

  if (reduced) return <StaticComparison demo={demo} />;

  return (
    <div
      ref={rootRef}
      className="demo-anim"
      data-phase={phase}
      role="img"
      aria-label={`${demo.prompt} ${demo.cloned}. ${demo.blockedLabel}: ${demo.blocked}.`}
    >
      <div className="grid gap-5 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-stretch">
        {/* Left: the screenshot thumbnail (the asset being copied). */}
        <div className="flex flex-col gap-3">
          <p className="eyebrow">screenshot</p>
          <Thumbnail />

          {/* The clone appears beneath — the scary beat. */}
          <div className="relative">
            <div className="demo-clone">
              <Thumbnail cloned />
              <p className="demo-cloned mt-2 text-center font-mono text-xs text-danger">
                {demo.cloned}
              </p>
            </div>
          </div>
        </div>

        {/* Right: the coding-agent terminal, with the gate over it. */}
        <div className="relative overflow-hidden rounded-xl border border-ink-200 bg-ink-950 shadow-pop">
          {/* Terminal chrome + label */}
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
              <span className="size-2 rounded-full bg-white/20" />
            </span>
            <span className="ml-1 font-mono text-[11px] tracking-wide text-ink-400">
              <span className="demo-label-before">{demo.promptLabel}</span>
              <span className="demo-label-after inline-flex items-center gap-1 text-brand">
                <ShieldCheck className="size-3" aria-hidden />
                {demo.blockedLabel}
              </span>
            </span>
          </div>

          {/* Terminal body */}
          <div className="min-h-[168px] px-4 py-4 font-mono text-sm leading-relaxed">
            <p className="text-ink-100">
              <span className="text-brand" aria-hidden>
                {"> "}
              </span>
              <span
                className="demo-typed"
                style={{ ["--typed" as string]: typed }}
              >
                {demo.prompt}
              </span>
              <span className="demo-caret text-brand" aria-hidden>
                ▌
              </span>
            </p>

            {/* "cloning…" progress */}
            <div className="demo-shimmer-track mt-5">
              <p className="text-xs text-ink-400">{demo.cloning}</p>
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                <div className="demo-shimmer h-full w-full rounded-full bg-brand" />
              </div>
            </div>
          </div>

          {/* The POCX gate — slides down over the terminal on "gate". */}
          <div
            aria-hidden
            className="demo-gate absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-950/95 backdrop-blur-sm"
          >
            <span className="demo-lock inline-flex size-11 items-center justify-center rounded-full border border-danger/40 bg-danger/10 text-danger">
              <Lock className="size-5" aria-hidden />
            </span>
            <span className="demo-stamp rounded-md border border-danger/50 bg-danger/10 px-3 py-1.5 font-mono text-xs font-bold tracking-wide text-danger">
              {demo.blocked}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* A miniature product-demo mock — sidebar, header, chart bars and table
   rows — so it instantly reads as "an app screenshot". The clone renders
   the exact same app (it IS a clone); only the frame goes danger-toned. */
function Thumbnail({ cloned = false }: { cloned?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white shadow-card ${
        cloned ? "border-danger/50" : "border-ink-200"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 border-b px-3 py-2 ${
          cloned ? "border-danger/20 bg-danger-subtle" : "border-ink-100 bg-ink-50"
        }`}
      >
        <span className="size-1.5 rounded-full bg-ink-300" />
        <span className="size-1.5 rounded-full bg-ink-300" />
        <span className="size-1.5 rounded-full bg-ink-300" />
        {cloned ? (
          <span className="ml-auto font-mono text-[9px] tracking-wide text-danger">
            copy
          </span>
        ) : null}
      </div>

      {/* App body: tiny sidebar + main pane. Identical in both cards. */}
      <div className="flex">
        <div className="flex w-11 shrink-0 flex-col border-r border-ink-100 bg-ink-50/60 p-2">
          <span className="size-3 rounded bg-ink-300" />
          <div className="mt-2.5 space-y-2">
            <div className="h-1 w-full rounded-full bg-ink-300" />
            <div className="h-1 w-5/6 rounded-full bg-ink-200" />
            <div className="h-1 w-4/6 rounded-full bg-ink-200" />
            <div className="h-1 w-5/6 rounded-full bg-ink-200" />
          </div>
        </div>

        <div className="min-w-0 flex-1 p-2.5">
          <div className="flex items-center justify-between">
            <div className="h-1.5 w-12 rounded-full bg-ink-300" />
            <div className="size-3 rounded-full bg-ink-200" />
          </div>
          <div className="mt-2 flex h-10 items-end gap-1">
            <div className="h-4 flex-1 rounded-sm bg-ink-200" />
            <div className="h-6 flex-1 rounded-sm bg-ink-200" />
            <div className="h-5 flex-1 rounded-sm bg-ink-200" />
            <div className="h-8 flex-1 rounded-sm bg-brand/60" />
            <div className="h-6 flex-1 rounded-sm bg-ink-200" />
            <div className="h-7 flex-1 rounded-sm bg-ink-200" />
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-ink-100" />
            <div className="h-1.5 w-5/6 rounded-full bg-ink-100" />
            <div className="h-1.5 w-4/6 rounded-full bg-ink-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Reduced-motion fallback: the two end states, side by side. */
function StaticComparison({ demo }: { demo: Demo }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {/* Without POCX → cloned */}
      <div className="rounded-xl border border-ink-200 bg-white p-5 shadow-card">
        <p className="eyebrow">{demo.promptLabel}</p>
        <div className="mt-4">
          <Thumbnail cloned />
        </div>
        <p className="mt-3 text-center font-mono text-xs text-danger">
          {demo.cloned}
        </p>
      </div>

      {/* With POCX → blocked */}
      <div className="flex flex-col rounded-xl border border-ink-200 bg-ink-950 p-5 shadow-card">
        <p className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide text-brand">
          <ShieldCheck className="size-3" aria-hidden />
          {demo.blockedLabel}
        </p>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8">
          <span className="inline-flex size-11 items-center justify-center rounded-full border border-danger/40 bg-danger/10 text-danger">
            <Lock className="size-5" aria-hidden />
          </span>
          <span className="rounded-md border border-danger/50 bg-danger/10 px-3 py-1.5 font-mono text-xs font-bold tracking-wide text-danger">
            {demo.blocked}
          </span>
        </div>
      </div>
    </div>
  );
}
