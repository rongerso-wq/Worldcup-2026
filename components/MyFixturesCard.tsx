"use client";

import { useEffect, useState } from "react";
import type { Team } from "@/lib/teams";
import type { Match } from "@/lib/types";
import { parseKickoffMs, formatIsraelDate, formatIsraelTime, formatIsraelDay } from "@/lib/datetime";
import { buildIcs, downloadIcs } from "@/lib/ics";
import { haptics } from "@/lib/haptics";

type ApiResponse = {
  ok: boolean;
  team?: { code: string; name: string; flag: string };
  fixtures?: Match[];
  error?: string;
};

export default function MyFixturesCard({ team }: { team: Team }) {
  const [fixtures, setFixtures] = useState<Match[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setFixtures(null);
    setErr(null);
    fetch(`/api/team/${team.code}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((j) => {
        if (cancelled) return;
        if (!j.ok || !j.fixtures) {
          setErr(j.error || "fetch_failed");
          return;
        }
        // Group-stage only — knockout opponents aren't known yet pre-tournament.
        const group = j.fixtures.filter((m) => !!m.group);
        setFixtures(group);
      })
      .catch((e) => !cancelled && setErr(String(e)));
    return () => { cancelled = true; };
  }, [team.code]);

  const handleDownload = () => {
    if (!fixtures || fixtures.length === 0) return;
    haptics.pick();
    const ics = buildIcs(
      fixtures.map((m) => ({ match: m, ourTeam: { code: team.code, name: team.name } })),
    );
    downloadIcs(`${team.code}-WC2026-group-fixtures.ics`, ics);
  };

  return (
    <section className="card-dim p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2
          className="font-display uppercase tracking-[0.22em] text-[11px] flex items-center gap-2"
          style={{ color: "var(--team-primary)" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--team-primary)", boxShadow: "0 0 10px var(--team-primary)" }}
          />
          {team.code} group fixtures
        </h2>
        <span className="text-[10px] uppercase tracking-[0.18em] font-display text-[color:var(--ink-faint)]">
          Israel time
        </span>
      </div>

      {err && (
        <div className="text-[12px] text-[color:var(--ink-dim)]">
          Couldn&apos;t load fixtures for {team.name}.
        </div>
      )}

      {!err && fixtures == null && (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg animate-pulse"
              style={{ background: "color-mix(in oklab, var(--bg-card) 50%, transparent)", animationDelay: `${i * 110}ms` }}
            />
          ))}
        </div>
      )}

      {!err && fixtures && fixtures.length === 0 && (
        <div className="text-[12px] text-[color:var(--ink-dim)]">
          No group-stage fixtures found for {team.name}.
        </div>
      )}

      {!err && fixtures && fixtures.length > 0 && (
        <>
          <ul className="flex flex-col gap-1.5">
            {fixtures.map((m) => {
              const kt = parseKickoffMs(m);
              const opponent = m.home.name === team.name ? m.away.name : m.home.name;
              const isHome = m.home.name === team.name;
              return (
                <li
                  key={m.id}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-lg"
                  style={{ background: "color-mix(in oklab, var(--bg-card) 45%, transparent)" }}
                >
                  <div className="flex flex-col items-center min-w-[44px]">
                    <span className="font-display uppercase tracking-wider text-[10px] text-[color:var(--ink-faint)]">
                      {formatIsraelDay(kt)}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-[color:var(--ink)]">
                      {formatIsraelDate(kt)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[color:var(--ink)] truncate">
                      {isHome ? "vs" : "@"} {opponent}
                    </div>
                    {m.venue && (
                      <div className="font-mono text-[10px] text-[color:var(--ink-faint)] truncate">
                        {m.venue}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="font-mono text-[13px] tabular-nums text-[color:var(--ink)]">
                      {formatIsraelTime(kt)}
                    </span>
                    <span className="font-display uppercase tracking-[0.18em] text-[9px] text-[color:var(--ink-faint)]">
                      {m.group ? `Group ${m.group}` : m.round}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={handleDownload}
            className="self-start chip-glow rounded-full px-4 py-2 font-display uppercase tracking-[0.18em] text-[11px] flex items-center gap-2 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--team-ink-hi)]"
          >
            <CalendarIcon />
            Add to calendar
          </button>
          <p className="text-[10px] text-[color:var(--ink-faint)] leading-relaxed">
            Downloads an <code className="font-mono">.ics</code> file — works with Google Calendar, Apple Calendar, Outlook.
          </p>
        </>
      )}
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}
