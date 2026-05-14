"use client";

import { useEffect, useState } from "react";
import { formatIsraelDate, formatIsraelTime } from "@/lib/datetime";
import type { Team } from "@/lib/teams";

type ApiMatch = {
  id: string;
  date: string;
  kickoffISO?: string;
  time?: string;
  venue?: string;
  group?: string;
  round?: string;
  status: "scheduled" | "live" | "finished";
  homeScore: number | null;
  awayScore: number | null;
};

export default function MatchHero({
  match,
  home,
  away,
  kickoffMs,
}: {
  match: ApiMatch;
  home: Team;
  away: Team;
  kickoffMs: number;
}) {
  const live = match.status === "live";
  const finished = match.status === "finished";
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (live || finished) return;
    const tick = () => {
      const diff = Math.max(0, kickoffMs - Date.now());
      const d = Math.floor(diff / 86_400_000);
      const h = Math.floor((diff % 86_400_000) / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setCountdown(`${String(d).padStart(2,"0")}d ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [kickoffMs, live, finished]);

  return (
    <section className="card-dim relative overflow-hidden p-4 pt-5">
      {/* dual jersey rails top + bottom */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${home.primary}, ${away.primary})` }}
      />
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1"
        style={{ background: `linear-gradient(90deg, ${away.primary}, ${home.primary})` }}
      />

      <div className="font-display uppercase tracking-[0.24em] text-[10px] text-[color:var(--ink-faint)] text-center mb-3">
        {match.group ?? "—"} · {match.round ?? "—"}
      </div>

      <div className="flex items-center gap-3">
        <CrestBig team={home} side="home" />

        <div className="flex-1 flex flex-col items-center min-w-0">
          {finished || live ? (
            <div className="flex items-center gap-2 my-1">
              <span className="score-num text-5xl tabular-nums" style={{ color: home.primary }}>
                {match.homeScore ?? 0}
              </span>
              <span className="score-num text-3xl text-[color:var(--ink-faint)]">–</span>
              <span className="score-num text-5xl tabular-nums" style={{ color: away.primary }}>
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <>
              <div className="font-mono text-[10px] tracking-wider text-[color:var(--ink-faint)]">
                {formatIsraelDate(kickoffMs)}
              </div>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="score-num text-[44px] tabular-nums">{formatIsraelTime(kickoffMs)}</span>
                <span className="font-display uppercase tracking-[0.2em] text-[10px] text-[color:var(--ink-faint)]">IL</span>
              </div>
            </>
          )}

          {live ? (
            <span
              className="font-display uppercase tracking-[0.22em] text-[10px] inline-flex items-center gap-1"
              style={{ color: "var(--floodlight)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--floodlight)", boxShadow: "0 0 8px var(--floodlight)" }} />
              live
            </span>
          ) : finished ? (
            <span className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)]">final</span>
          ) : (
            <span className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)]">
              {countdown ?? "—"}
            </span>
          )}
        </div>

        <CrestBig team={away} side="away" />
      </div>

      {match.venue && (
        <div className="mt-3 text-center font-mono text-[11px] text-[color:var(--ink-dim)] truncate">
          @ {match.venue}
        </div>
      )}
    </section>
  );
}

function CrestBig({ team, side }: { team: Team; side: "home" | "away" }) {
  return (
    <div className={`flex flex-col items-center gap-1 ${side === "home" ? "" : ""}`}>
      <span
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-[32px]"
        style={{
          background: `linear-gradient(135deg, ${team.primary}, ${team.accent})`,
          boxShadow: `0 14px 28px -12px ${team.primary}, inset 0 1px 0 color-mix(in oklab, white 25%, transparent)`,
          border: `1px solid color-mix(in oklab, white 12%, transparent)`,
        }}
      >
        {team.flag}
      </span>
      <span className="font-display uppercase tracking-wider text-base leading-none mt-1">
        {team.code}
      </span>
      <span className="text-[10px] text-[color:var(--ink-faint)] truncate max-w-[80px]">
        {team.name}
      </span>
    </div>
  );
}
