"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BRACKET,
  ROUND_LABELS,
  ROUND_ORDER,
  STORAGE_KEY,
  byRound,
  resolveSlot,
  type BracketMatch,
  type BracketRound,
  type Predictions,
} from "@/lib/bracket";
import { findTeamByName, type Team } from "@/lib/teams";
import { formatIsraelDate, formatIsraelTime } from "@/lib/datetime";
import { useTeamTheme } from "@/components/JerseyThemeProvider";
import { haptics } from "@/lib/haptics";

const COL_WIDTH = 252;

export default function BracketPage() {
  const { team, hasTeam } = useTeamTheme();
  const [preds, setPreds] = useState<Predictions>({});

  // hydrate predictions — validate shape before trusting localStorage.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw || raw.length > 5_000) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
      const clean: Predictions = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const num = Number(k);
        if (!Number.isInteger(num) || num < 1 || num > 200) continue;
        if (v !== "slot1" && v !== "slot2") continue;
        clean[num] = v;
      }
      setPreds(clean);
    } catch {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
    }
  }, []);

  const persist = (next: Predictions) => {
    setPreds(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };

  const pick = (num: number, side: "slot1" | "slot2") => {
    const isChange = preds[num] !== side;
    persist({ ...preds, [num]: side });
    if (isChange) haptics.pick();
  };

  const reset = () => {
    if (Object.keys(preds).length === 0) return;
    if (!confirm("Reset all predictions?")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setPreds({});
  };

  const totalPredicted = Object.keys(preds).length;
  // R32 has 16, R16 8, QF 4, SF 2, 3rd 1, F 1 = 32 total
  const totalMatches = BRACKET.length;

  // Round-jumper: scroll the strip to a given round.
  const stripRef = useRef<HTMLDivElement>(null);
  const [activeRound, setActiveRound] = useState<BracketRound>(ROUND_ORDER[0]);
  const jumpToRound = (idx: number) => {
    haptics.tap();
    const el = stripRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * COL_WIDTH - 8, behavior: "smooth" });
    setActiveRound(ROUND_ORDER[idx]);
  };
  const onStripScroll = () => {
    const el = stripRef.current;
    if (!el) return;
    const idx = Math.min(
      ROUND_ORDER.length - 1,
      Math.max(0, Math.round((el.scrollLeft + COL_WIDTH / 2) / COL_WIDTH)),
    );
    if (ROUND_ORDER[idx] !== activeRound) setActiveRound(ROUND_ORDER[idx]);
  };

  // Identify your team's path through the bracket for highlighting.
  const myPath = useMemo(() => {
    if (!hasTeam) return new Set<number>();
    const set = new Set<number>();
    for (const m of BRACKET) {
      const s1 = resolveSlot(m.slot1, preds);
      const s2 = resolveSlot(m.slot2, preds);
      if (s1 === team.name || s2 === team.name) set.add(m.num);
    }
    return set;
  }, [hasTeam, team.name, preds]);

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between">
        <div>
          <h1
            className="font-display uppercase tracking-wider text-3xl leading-none"
            style={{ color: "var(--team-primary)" }}
          >
            Bracket
          </h1>
          <p className="text-[11px] uppercase tracking-[0.22em] font-display text-[color:var(--ink-faint)] mt-1">
            {totalPredicted}/{totalMatches} predictions · tap a side to advance
          </p>
        </div>
        {totalPredicted > 0 && (
          <button
            onClick={reset}
            className="font-display uppercase tracking-[0.18em] text-[11px] chip-glow rounded-full px-3 py-1.5"
          >
            Reset
          </button>
        )}
      </header>

      {/* Round-jumper: pill row above the bracket. WCAG 2.2 SC 1.3.1 +
          ARIA APG scroll-to-section: nav + aria-current="step" on active. */}
      <nav aria-label="Jump to bracket round" className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-1.5 pb-1">
          {ROUND_ORDER.map((r, idx) => {
            const active = r === activeRound;
            return (
              <button
                key={r}
                type="button"
                aria-current={active ? "step" : undefined}
                onClick={() => jumpToRound(idx)}
                className="shrink-0 rounded-full px-3 py-1.5 font-display uppercase tracking-[0.18em] text-[11px] transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--team-ink-hi)]"
                style={{
                  background: active
                    ? "linear-gradient(135deg, var(--team-primary), var(--team-accent))"
                    : "color-mix(in oklab, var(--bg-card) 50%, transparent)",
                  color: active ? "var(--team-ink-hi, var(--team-ink))" : "var(--ink-dim)",
                  border: `1px solid ${active ? "var(--team-primary)" : "color-mix(in oklab, white 8%, transparent)"}`,
                }}
              >
                {ROUND_LABELS[r]}
              </button>
            );
          })}
        </div>
      </nav>

      {/* horizontally scrollable rounds */}
      <div className="relative -mx-4">
        {/* edge fade-masks signal "scroll for more" */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 right-0 bottom-2 w-10 z-10"
          style={{ background: "linear-gradient(270deg, var(--bg-deep), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 bottom-2 w-6 z-10"
          style={{ background: "linear-gradient(90deg, var(--bg-deep), transparent)" }}
        />
        <div
          ref={stripRef}
          onScroll={onStripScroll}
          role="region"
          aria-label={`Knockout bracket, ${activeRound} round in view, scrollable`}
          tabIndex={0}
          className="px-4 overflow-x-auto no-scrollbar scroll-smooth"
        >
          <div className="flex items-start gap-3 pb-2" style={{ width: ROUND_ORDER.length * COL_WIDTH }}>
          {ROUND_ORDER.map((r) => (
            <RoundColumn
              key={r}
              round={r}
              matches={byRound(r)}
              preds={preds}
              onPick={pick}
              myPath={myPath}
              myTeam={hasTeam ? team : null}
            />
          ))}
          </div>
        </div>
      </div>

      <p className="px-1 text-[11px] text-[color:var(--ink-faint)] leading-relaxed">
        Group-stage outcomes aren&apos;t predictable here — slots labelled <em>1A</em>, <em>2B</em>, <em>3A/B/C/D/F</em> stay as placeholders. Your predictions propagate forward through the bracket and persist on this device.
      </p>
    </div>
  );
}

function RoundColumn({
  round,
  matches,
  preds,
  onPick,
  myPath,
  myTeam,
}: {
  round: BracketRound;
  matches: BracketMatch[];
  preds: Predictions;
  onPick: (num: number, side: "slot1" | "slot2") => void;
  myPath: Set<number>;
  myTeam: Team | null;
}) {
  return (
    <div className="shrink-0" style={{ width: COL_WIDTH }}>
      <div
        className="sticky top-14 z-10 -mx-1 px-1 pb-2 mb-2"
        style={{
          background:
            "linear-gradient(180deg, var(--bg-deep) 60%, color-mix(in oklab, var(--bg-deep) 0%, transparent) 100%)",
        }}
      >
        <div className="font-display uppercase tracking-[0.22em] text-[11px] text-[color:var(--team-primary)]">
          {ROUND_LABELS[round]}
        </div>
        <div className="font-mono text-[10px] text-[color:var(--ink-faint)] mt-0.5 tabular-nums">
          {matches.length} {matches.length === 1 ? "match" : "matches"}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {matches.map((m) => (
          <Tie
            key={m.num}
            match={m}
            preds={preds}
            onPick={onPick}
            highlighted={myPath.has(m.num)}
            myTeam={myTeam}
            isFinal={round === "F"}
          />
        ))}
      </div>
    </div>
  );
}

function Tie({
  match,
  preds,
  onPick,
  highlighted,
  myTeam,
  isFinal,
}: {
  match: BracketMatch;
  preds: Predictions;
  onPick: (num: number, side: "slot1" | "slot2") => void;
  highlighted: boolean;
  myTeam: Team | null;
  isFinal: boolean;
}) {
  const slot1Label = resolveSlot(match.slot1, preds);
  const slot2Label = resolveSlot(match.slot2, preds);
  const pickedSide = preds[match.num];
  const team1 = findTeamByName(slot1Label);
  const team2 = findTeamByName(slot2Label);

  // For 3rd-place and Final, the slot is a placeholder until SFs are predicted —
  // can only enable picks when both sides resolve to picks or known team names.
  const canPickSide1 = !!team1 || !/^[123WL]/.test(slot1Label);
  const canPickSide2 = !!team2 || !/^[123WL]/.test(slot2Label);
  const canPick = canPickSide1 && canPickSide2;

  return (
    <div
      className="card-dim overflow-hidden relative"
      style={
        highlighted
          ? {
              borderColor: "var(--team-primary)",
              boxShadow:
                "0 0 0 1px color-mix(in oklab, var(--team-primary) 40%, transparent), 0 24px 50px -20px color-mix(in oklab, var(--team-primary) 60%, transparent)",
            }
          : undefined
      }
    >
      {isFinal && (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{
            background: "linear-gradient(90deg, var(--team-primary), var(--team-accent), var(--team-primary))",
          }}
        />
      )}

      <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between">
        <span className="font-mono text-[9px] tabular-nums text-[color:var(--ink-faint)]">
          #{match.num} · {formatIsraelDate(match.kickoffMs)}
        </span>
        <span className="font-mono text-[9px] tabular-nums text-[color:var(--ink-faint)]">
          {formatIsraelTime(match.kickoffMs)} IL
        </span>
      </div>

      <SlotRow
        label={slot1Label}
        team={team1}
        picked={pickedSide === "slot1"}
        otherPicked={pickedSide === "slot2"}
        onPick={() => canPick && onPick(match.num, "slot1")}
        canPick={canPick}
        isMine={!!myTeam && team1?.code === myTeam.code}
      />
      <div className="px-3 py-0.5 font-display uppercase tracking-[0.2em] text-[8px] text-center text-[color:var(--ink-faint)] border-y border-[color:var(--line)]/40">
        vs
      </div>
      <SlotRow
        label={slot2Label}
        team={team2}
        picked={pickedSide === "slot2"}
        otherPicked={pickedSide === "slot1"}
        onPick={() => canPick && onPick(match.num, "slot2")}
        canPick={canPick}
        isMine={!!myTeam && team2?.code === myTeam.code}
      />

      {match.venue && (
        <div className="px-3 py-1.5 font-mono text-[9px] text-[color:var(--ink-faint)] truncate">
          @ {match.venue}
        </div>
      )}

      {isFinal && (
        <div className="px-3 pb-2 -mt-1 flex items-center justify-center gap-1.5 font-display uppercase tracking-[0.22em] text-[10px]" style={{ color: "var(--gold)" }}>
          <TrophyIcon /> trophy
        </div>
      )}
    </div>
  );
}

function SlotRow({
  label,
  team,
  picked,
  otherPicked,
  onPick,
  canPick,
  isMine,
}: {
  label: string;
  team: Team | undefined;
  picked: boolean;
  otherPicked: boolean;
  onPick: () => void;
  canPick: boolean;
  isMine: boolean;
}) {
  const dim = otherPicked;
  const bg = picked
    ? team
      ? `linear-gradient(90deg, ${team.primary} 0%, ${team.accent} 100%)`
      : "color-mix(in oklab, var(--team-primary) 70%, transparent)"
    : "transparent";

  return (
    <button
      type="button"
      onClick={onPick}
      disabled={!canPick}
      className="w-full px-3 py-2 flex items-center gap-2 transition-opacity active:scale-[0.98] disabled:cursor-not-allowed"
      style={{
        background: bg,
        opacity: dim ? 0.45 : canPick ? 1 : 0.7,
        color: picked && team ? team.ink : "var(--ink)",
      }}
    >
      <span
        className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 text-base"
        style={{
          background: team
            ? `linear-gradient(135deg, ${team.primary}, ${team.accent})`
            : "color-mix(in oklab, var(--bg-card) 60%, transparent)",
          border: "1px solid color-mix(in oklab, white 10%, transparent)",
        }}
      >
        {team ? team.flag : "?"}
      </span>
      <div className="flex-1 min-w-0 flex flex-col items-start">
        <span className="font-display uppercase tracking-wider text-[13px] leading-none truncate max-w-full">
          {team ? team.code : label}
          {isMine && <span className="ml-1 text-[9px] opacity-80">(mine)</span>}
        </span>
        <span className="text-[10px] opacity-70 truncate max-w-full">
          {team?.name ?? "TBD"}
        </span>
      </div>
      {picked && (
        <span
          aria-hidden
          className="text-[14px] leading-none"
          style={{ color: team?.ink ?? "var(--ink)" }}
        >
          ✓
        </span>
      )}
    </button>
  );
}

function TrophyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M5 6H3a3 3 0 0 0 3 3M19 6h2a3 3 0 0 1-3 3" />
      <path d="M10 13h4v3l1 4H9l1-4v-3z" />
    </svg>
  );
}
