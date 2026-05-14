"use client";

import { useEffect, useMemo, useState } from "react";
import { useTeamTheme } from "./JerseyThemeProvider";
import MatchCard, { toViewLoose, type MatchView } from "./MatchCard";

type ApiMatch = Parameters<typeof toViewLoose>[0];
type ApiResponse = { ok: boolean; matches: ApiMatch[] };

export default function UpNextRail() {
  const { team, hasTeam } = useTeamTheme();
  const [data, setData] = useState<ApiMatch[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fixtures")
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((j) => {
        if (!cancelled) setData(j.matches ?? []);
      })
      .catch((e) => {
        if (!cancelled) setErr(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { pinned, upcoming } = useMemo(() => {
    if (!data) return { pinned: null as MatchView | null, upcoming: [] as MatchView[] };
    const now = Date.now();
    // Loose view: knockout placeholders (W73, 1A) render as TBD cards instead
    // of being silently filtered out. Honest > pretending the schedule shrank.
    const all = data
      .map(toViewLoose)
      .filter((m) => m.kt >= now);
    all.sort((a, b) => a.kt - b.kt);

    if (hasTeam) {
      const myIdx = all.findIndex(
        (m) => m.home.code === team.code || m.away.code === team.code,
      );
      if (myIdx >= 0) {
        const [my] = all.splice(myIdx, 1);
        return { pinned: my, upcoming: all.slice(0, 5) };
      }
    }
    return { pinned: null, upcoming: all.slice(0, 6) };
  }, [data, team.code, hasTeam]);

  if (err) {
    return (
      <section className="card-dim p-4">
        <div className="text-sm text-[color:var(--ink-dim)]">Couldn&apos;t load fixtures.</div>
      </section>
    );
  }

  if (!data) {
    return (
      <section>
        <Heading label="Up next" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="card-dim h-[88px] animate-pulse"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (!pinned && upcoming.length === 0) {
    return (
      <section className="card-dim p-4">
        <div className="text-sm text-[color:var(--ink-dim)]">No upcoming matches found.</div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {pinned && (
        <div>
          <Heading label={`Your match · ${team.code}`} accent />
          <MatchCard m={pinned} highlight />
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <Heading label={pinned ? "Coming up" : "Up next"} />
          <div className="space-y-2">
            {upcoming.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Heading({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <h2
      className="font-display uppercase tracking-[0.22em] text-[10px] mb-2 px-1 flex items-center gap-2"
      style={{ color: accent ? "var(--team-primary)" : "var(--ink-faint)" }}
    >
      {accent && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: "var(--team-primary)", boxShadow: "0 0 10px var(--team-primary)" }}
        />
      )}
      {label}
    </h2>
  );
}
