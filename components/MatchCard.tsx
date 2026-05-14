"use client";

import Link from "next/link";
import { findTeamByName, type Team } from "@/lib/teams";
import {
  parseKickoffMs,
  formatIsraelTime,
  formatIsraelDate,
  israelIsoDate,
} from "@/lib/datetime";

// Placeholder for slots that haven't resolved to a known team yet
// (knockout placeholders like W73, L101, 1A). Lets the rail/grid show
// "TBD" cards instead of silently dropping the match.
function tbdTeam(rawName: string | undefined): Team {
  return {
    code: "TBD",
    name: rawName?.trim() || "TBD",
    flag: "❓",
    primary: "#3a4660",
    secondary: "#5b6a85",
    accent: "#7a8aa5",
    ink: "#ffffff",
  };
}

type ApiMatch = {
  id: string;
  date: string;
  kickoffISO?: string;
  time?: string;
  venue?: string;
  group?: string;
  round?: string;
  status?: "scheduled" | "live" | "finished";
  home: { name: string };
  away: { name: string };
  homeScore?: number | null;
  awayScore?: number | null;
};

export type MatchView = {
  id: string;
  kt: number;
  date: string;           // raw (source-of-truth) date
  ilDate: string;         // Israel-local date YYYY-MM-DD (used for grouping)
  ilTime: string;         // "HH:MM" in Israel time
  venue?: string;
  group?: string;
  round?: string;
  home: Team;
  away: Team;
  status: "scheduled" | "live" | "finished";
  homeScore: number | null;
  awayScore: number | null;
};

export function toView(m: ApiMatch): MatchView | undefined {
  const home = findTeamByName(m.home.name);
  const away = findTeamByName(m.away.name);
  if (!home || !away) return undefined;
  const kt = parseKickoffMs(m);
  return {
    id: m.id,
    kt,
    date: m.date,
    ilDate: israelIsoDate(kt),
    ilTime: formatIsraelTime(kt),
    venue: m.venue,
    group: m.group,
    round: m.round,
    home,
    away,
    status: m.status ?? "scheduled",
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
  };
}

// Loose variant: also returns a view for knockout placeholders, with TBD
// stand-ins. Use when honest "match is on the schedule, opponent unknown" is
// better UX than silent drops (e.g. Up Next rail).
export function toViewLoose(m: ApiMatch): MatchView {
  const home = findTeamByName(m.home.name) ?? tbdTeam(m.home.name);
  const away = findTeamByName(m.away.name) ?? tbdTeam(m.away.name);
  const kt = parseKickoffMs(m);
  return {
    id: m.id,
    kt,
    date: m.date,
    ilDate: israelIsoDate(kt),
    ilTime: formatIsraelTime(kt),
    venue: m.venue,
    group: m.group,
    round: m.round,
    home,
    away,
    status: m.status ?? "scheduled",
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
  };
}

export default function MatchCard({
  m,
  highlight = false,
  showDate = true,
}: {
  m: MatchView;
  highlight?: boolean;
  showDate?: boolean;
}) {
  const finished = m.status === "finished";
  const live = m.status === "live";
  return (
    <Link
      href={`/match/${m.id}`}
      className="block card-dim relative overflow-hidden transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--team-ink-hi)]"
      style={
        highlight
          ? {
              borderColor: "var(--team-primary)",
              boxShadow:
                "0 0 0 1px color-mix(in oklab, var(--team-primary) 35%, transparent), 0 30px 60px -22px color-mix(in oklab, var(--team-primary) 55%, transparent)",
            }
          : undefined
      }
    >
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1.5"
        style={{
          background: `linear-gradient(180deg, ${m.home.primary}, ${m.away.primary})`,
        }}
      />
      <div className="pl-4 pr-3 py-3 grid items-center gap-2" style={{ gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)" }}>
        <Side team={m.home} align="end" />
        <div className="flex flex-col items-center min-w-[84px] px-1">
          {showDate && (
            <div className="font-mono text-[10px] tracking-wider text-[color:var(--ink-faint)]">
              {formatIsraelDate(m.kt)}
            </div>
          )}
          {finished || live ? (
            <div className="flex items-center gap-1.5 my-0.5">
              <span className="score-num text-2xl text-[color:var(--ink)] tabular-nums">
                {m.homeScore ?? 0}
              </span>
              <span className="font-display uppercase text-[10px] text-[color:var(--ink-faint)]">
                –
              </span>
              <span className="score-num text-2xl text-[color:var(--ink)] tabular-nums">
                {m.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="score-num text-2xl text-[color:var(--ink)] tabular-nums">{m.ilTime}</span>
              <span className="font-display uppercase tracking-[0.18em] text-[8px] text-[color:var(--ink-faint)]">IL</span>
            </div>
          )}
          {live ? (
            <span
              className="font-display uppercase tracking-[0.22em] text-[9px] inline-flex items-center gap-1"
              style={{ color: "var(--floodlight)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "var(--floodlight)", boxShadow: "0 0 8px var(--floodlight)" }}
              />
              live
            </span>
          ) : (
            <div className="font-display uppercase tracking-[0.2em] text-[9px] text-[color:var(--ink-faint)] truncate max-w-[120px]">
              {m.group ?? m.round ?? "—"}
            </div>
          )}
        </div>
        <Side team={m.away} align="start" />
      </div>
      {m.venue && (
        <div className="pl-4 pr-3 pb-2 font-mono text-[10px] text-[color:var(--ink-faint)] truncate">
          @ {m.venue}
        </div>
      )}
    </Link>
  );
}

function Side({ team, align }: { team: Team; align: "start" | "end" }) {
  return (
    <div
      className={`min-w-0 flex items-center gap-2 ${
        align === "end" ? "justify-end" : "justify-start"
      }`}
    >
      {align === "start" && <Crest team={team} />}
      <div className={`min-w-0 flex flex-col ${align === "end" ? "items-end text-right" : "items-start text-left"}`}>
        <span className="font-display uppercase tracking-wider text-base leading-none">
          {team.code}
        </span>
        <span className="text-[12px] text-[color:var(--ink-dim)] leading-tight line-clamp-2 w-full">
          {team.name}
        </span>
      </div>
      {align === "end" && <Crest team={team} />}
    </div>
  );
}

function Crest({ team }: { team: Team }) {
  return (
    <span
      className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
      style={{
        background: `linear-gradient(135deg, ${team.primary}, ${team.accent})`,
        boxShadow: `0 6px 16px -8px ${team.primary}`,
      }}
    >
      {team.flag}
    </span>
  );
}
