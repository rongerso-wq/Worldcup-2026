"use client";

import Link from "next/link";
import { useState } from "react";
import { TEAM_LIST, CONFEDERATIONS, type Confederation } from "@/lib/teams";
import { getGroupLetter } from "@/lib/groups";
import { useTeamTheme } from "@/components/JerseyThemeProvider";

type Filter = "ALL" | Confederation;

const ALL_FILTERS: Filter[] = ["ALL", ...CONFEDERATIONS];

export default function TeamsPage() {
  const { team, hasTeam, setTeamCode, clearTeam } = useTeamTheme();
  const [filter, setFilter] = useState<Filter>("ALL");

  const teams =
    filter === "ALL"
      ? TEAM_LIST
      : TEAM_LIST.filter((t) => t.confederation === filter);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display uppercase tracking-wider text-3xl" style={{ color: "var(--team-primary)" }}>
          Teams
        </h1>
        <p className="text-[11px] uppercase tracking-[0.22em] font-display text-[color:var(--ink-faint)] mt-1">
          {teams.length} of {TEAM_LIST.length} · {filter}
        </p>
      </div>

      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {ALL_FILTERS.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="shrink-0 rounded-full px-3 py-1.5 font-display uppercase tracking-[0.18em] text-[11px] transition-transform active:scale-95"
                style={{
                  background: active
                    ? `linear-gradient(135deg, var(--team-primary), var(--team-accent))`
                    : "color-mix(in oklab, var(--bg-card) 50%, transparent)",
                  color: active ? "var(--team-ink)" : "var(--ink-dim)",
                  border: `1px solid ${
                    active
                      ? "var(--team-primary)"
                      : "color-mix(in oklab, white 8%, transparent)"
                  }`,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* None / no-team tile only shown when ALL filter active */}
        {filter === "ALL" && (
          <button
            onClick={clearTeam}
            className="aspect-[3/4] rounded-2xl p-3 flex flex-col items-center justify-between clip-fifa transition-transform active:scale-95"
            style={{
              background: "linear-gradient(160deg, #5DA5C5, #7C8AA8 90%)",
              color: "#FFFFFF",
              border: !hasTeam ? "2px solid var(--floodlight)" : "1px solid var(--line)",
              boxShadow: !hasTeam
                ? "0 0 0 4px color-mix(in oklab, var(--floodlight) 25%, transparent), 0 14px 30px -16px #5DA5C5"
                : "0 10px 22px -14px #5DA5C5",
            }}
          >
            <span className="text-3xl leading-none" aria-hidden>✕</span>
            <div className="text-center">
              <div className="font-display uppercase tracking-wider text-lg leading-none">None</div>
              <div className="text-[10px] opacity-80 mt-1">No team</div>
            </div>
          </button>
        )}

        {teams.map((t) => {
          const active = hasTeam && t.code === team.code;
          const group = getGroupLetter(t.name);
          return (
            <div key={t.code} className="relative">
              <Link
                href={`/team/${t.code}`}
                onClick={() => { if (!active) setTeamCode(t.code); }}
                className="aspect-[3/4] rounded-2xl p-3 flex flex-col items-center justify-between clip-fifa transition-transform active:scale-95 block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--team-accent)]"
                style={{
                  background: `linear-gradient(160deg, ${t.primary}, ${t.accent} 90%)`,
                  color: t.ink,
                  border: active ? `2px solid var(--floodlight)` : "1px solid var(--line)",
                  boxShadow: active
                    ? `0 0 0 4px color-mix(in oklab, var(--floodlight) 25%, transparent), 0 14px 30px -16px ${t.primary}`
                    : `0 10px 22px -14px ${t.primary}`,
                }}
              >
                <span className="text-3xl leading-none">{t.flag}</span>
                <div className="text-center">
                  <div className="font-display uppercase tracking-wider text-lg leading-none">{t.code}</div>
                  <div className="text-[10px] opacity-80 mt-1 truncate max-w-full">{t.name}</div>
                </div>
              </Link>
              {/* group letter pill */}
              {group && (
                <span
                  className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md font-display uppercase tracking-wider text-[10px]"
                  style={{
                    background: "color-mix(in oklab, black 55%, transparent)",
                    color: t.ink,
                    border: "1px solid color-mix(in oklab, white 18%, transparent)",
                  }}
                >
                  {group}
                </span>
              )}
              {/* pick chip — 44x44 hit area, 28px visual nub for compact look */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTeamCode(t.code); }}
                onPointerDown={(e) => e.stopPropagation()}
                className="absolute top-0 right-0 z-10 w-11 h-11 flex items-center justify-center focus-visible:outline-none"
                aria-label={active ? `${t.name} selected` : `Pick ${t.name}`}
                aria-pressed={active}
              >
                <span
                  aria-hidden
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[15px] leading-none"
                  style={{
                    background: active
                      ? "var(--floodlight)"
                      : "color-mix(in oklab, black 55%, transparent)",
                    color: active ? "#0a1410" : t.ink,
                    border: "1px solid color-mix(in oklab, white 18%, transparent)",
                    boxShadow: active
                      ? "0 0 0 3px color-mix(in oklab, var(--floodlight) 30%, transparent)"
                      : "none",
                  }}
                >
                  {active ? "✓" : "+"}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
