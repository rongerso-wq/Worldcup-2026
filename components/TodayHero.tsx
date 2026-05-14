"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { useTeamTheme } from "./JerseyThemeProvider";
import { formatIsraelTime, formatIsraelDate } from "@/lib/datetime";

// Opener: Mexico vs South Africa, June 11 2026, 13:00 local (UTC-6) = 19:00 UTC = 22:00 IL
const OPENING_MS = Date.parse("2026-06-11T19:00:00Z");

type Parts = { d: number; h: number; m: number; s: number };
function timeUntil(targetMs: number): Parts {
  const diff = Math.max(0, targetMs - Date.now());
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1_000),
  };
}

export default function TodayHero() {
  const { team, hasTeam } = useTeamTheme();
  // null on server / first paint → no time-dependent text rendered, no hydration mismatch
  const [now, setNow] = useState<Parts | null>(null);
  useEffect(() => {
    setNow(timeUntil(OPENING_MS));
    const id = setInterval(() => setNow(timeUntil(OPENING_MS)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative pt-2" aria-label="Countdown to opening match">
      {/* eyebrow */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: "var(--team-accent)", boxShadow: "0 0 14px var(--team-accent)" }}
        />
        <span className="font-display uppercase tracking-[0.32em] text-[11px] text-[color:var(--ink-dim)]">
          opens in
        </span>
        <span className="font-mono text-[10px] text-[color:var(--ink-faint)] ml-auto tabular-nums">
          {formatIsraelDate(OPENING_MS)} · {formatIsraelTime(OPENING_MS)} IL 🇮🇱
        </span>
      </div>

      {/* monster countdown */}
      <div className="flex items-baseline gap-2 leading-none mb-4 select-none">
        <Slot value={now?.d ?? null} label="days"  color="var(--team-primary)"   big />
        <Slot value={now?.h ?? null} label="hours" color="var(--team-secondary)" />
        <Slot value={now?.m ?? null} label="mins"  color="var(--team-accent)"    />
        <Slot value={now?.s ?? null} label="secs"  color="var(--ink-dim)"        small />
      </div>

      {/* match line — same date+time treatment as the rest of the cards */}
      <div className="card-dim p-4 flex items-center gap-3">
        <Pill flag="🇲🇽" code="MEX" big />
        <div className="flex-1 flex flex-col items-center min-w-0">
          <div className="font-display uppercase tracking-[0.28em] text-[9px] text-[color:var(--ink-faint)]">
            opener · Group A
          </div>
          <div className="font-mono text-[10px] tracking-wider text-[color:var(--ink-faint)] mt-1">
            {formatIsraelDate(OPENING_MS)}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="score-num text-3xl text-[color:var(--ink)] tabular-nums">
              {formatIsraelTime(OPENING_MS)}
            </span>
            <span className="font-display uppercase tracking-[0.2em] text-[9px] text-[color:var(--ink-faint)]">IL</span>
          </div>
          <div className="font-mono text-[10px] text-[color:var(--ink-faint)] mt-0.5 truncate max-w-full">
            Estadio Azteca · Mexico City
          </div>
        </div>
        <Pill flag="🇿🇦" code="RSA" big />
      </div>

      {/* following strip */}
      <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-display">
        {hasTeam ? (
          <span className="chip-glow rounded-full px-3 py-1.5">
            <span className="mr-1">{team.flag}</span> Following {team.code}
          </span>
        ) : (
          <span className="chip-glow rounded-full px-3 py-1.5">Neutral mode</span>
        )}
        <span className="text-[color:var(--ink-faint)] ml-1">104 matches · 16 cities</span>
      </div>
    </section>
  );
}

function Slot({
  value,
  label,
  color,
  big = false,
  small = false,
}: {
  value: number | null;
  label: string;
  color: string;
  big?: boolean;
  small?: boolean;
}) {
  const text = value == null ? "--" : String(value).padStart(2, "0");
  // WCAG 2.2 SC 1.4.3: a wide neon halo over animated smoke can drop effective
  // contrast below 4.5:1. Cap "days" to 96px and replace the halo with a thin
  // ink-hi text-stroke + tight glow so the digit stays legible on every kit.
  const fontSize = big
    ? "clamp(64px, 18vw, 96px)"
    : small
    ? "clamp(36px, 11vw, 44px)"
    : "clamp(44px, 15vw, 64px)";
  return (
    <div className="flex flex-col items-center min-w-0">
      <div
        className="score-num tabular-nums relative overflow-hidden"
        style={{
          color,
          fontSize,
          lineHeight: 1,
          height: fontSize,
          WebkitTextStroke: `0.5px var(--team-ink-hi, ${color})`,
          textShadow: `0 0 10px color-mix(in oklab, ${color} 35%, transparent)`,
        }}
        suppressHydrationWarning
        aria-label={`${value ?? 0} ${label}`}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={text}
            initial={{ y: "-100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="block"
          >
            {text}
          </m.span>
        </AnimatePresence>
      </div>
      <div className="font-display uppercase tracking-[0.28em] text-[9px] text-[color:var(--ink-faint)] -mt-1">
        {label}
      </div>
    </div>
  );
}

function Pill({ flag, code, big = false }: { flag: string; code: string; big?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl"
      style={{
        width: big ? 72 : 60,
        height: big ? 72 : 60,
        background: "color-mix(in oklab, var(--bg-card) 60%, transparent)",
        border: "1px solid color-mix(in oklab, white 10%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <span style={{ fontSize: big ? 30 : 26 }}>{flag}</span>
      <span className="font-display uppercase tracking-wider text-[11px] mt-0.5 text-[color:var(--ink)]">
        {code}
      </span>
    </div>
  );
}
