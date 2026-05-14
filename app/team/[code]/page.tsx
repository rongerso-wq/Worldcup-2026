"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { findTeamByName, getTeam, TEAMS } from "@/lib/teams";
import { getGroupLetter } from "@/lib/groups";
import { getStars } from "@/lib/stars";
import { useTeamTheme } from "@/components/JerseyThemeProvider";
import MatchCard, { toView, type MatchView } from "@/components/MatchCard";
import PlayerCard from "@/components/PlayerCard";
import PlayerSheet from "@/components/PlayerSheet";
import NewsStrip from "@/components/NewsStrip";
import type { Player } from "@/lib/types";

type ApiMatch = Parameters<typeof toView>[0];
type ApiResponse = { ok: boolean; team: { code: string; name: string; flag: string }; fixtures: ApiMatch[] };

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const team = TEAMS[code.toUpperCase()] ?? getTeam(code);
  const { team: chosen, hasTeam, setTeamCode } = useTeamTheme();
  const [fixtures, setFixtures] = useState<ApiMatch[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openPlayer, setOpenPlayer] = useState<Player | null>(null);
  const stars = getStars(team.code);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/team/${code}`)
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((j) => !cancelled && setFixtures(j.fixtures ?? []))
      .catch((e) => !cancelled && setErr(String(e)));
    return () => { cancelled = true; };
  }, [code]);

  const views = useMemo<MatchView[]>(() => {
    if (!fixtures) return [];
    return fixtures
      .map(toView)
      .filter((m): m is MatchView => !!m)
      .sort((a, b) => a.kt - b.kt);
  }, [fixtures]);

  const now = Date.now();
  const next = views.find((m) => m.kt >= now);
  const played = views.filter((m) => m.kt < now);
  const upcoming = views.filter((m) => m.kt >= now);
  const isMine = hasTeam && chosen.code === team.code;
  const group = getGroupLetter(team.name);

  return (
    <div className="space-y-4">
      <Link
        href="/teams"
        className="inline-flex items-center gap-1 font-display uppercase tracking-[0.18em] text-[11px] text-[color:var(--ink-dim)]"
      >
        ← teams
      </Link>

      {/* Hero */}
      <section
        className="card-dim relative overflow-hidden p-5 clip-fifa"
        style={{ borderColor: team.primary }}
      >
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${team.primary}, ${team.accent})` }}
        />
        <div className="flex items-center gap-4">
          <span
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-[40px]"
            style={{
              background: `linear-gradient(135deg, ${team.primary}, ${team.accent})`,
              boxShadow: `0 16px 30px -14px ${team.primary}, inset 0 1px 0 color-mix(in oklab, white 25%, transparent)`,
              border: "1px solid color-mix(in oklab, white 12%, transparent)",
            }}
          >
            {team.flag}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)]">
              {team.confederation ?? "—"}
              {group ? <span className="ml-2">· Group {group}</span> : null}
            </div>
            <h1
              className="font-display uppercase tracking-wider text-3xl leading-none mt-1 truncate"
              style={{ color: team.primary }}
            >
              {team.name}
            </h1>
            <div className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-dim)] mt-1">
              {team.code}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {isMine ? (
            <span
              className="font-display uppercase tracking-[0.2em] text-[11px] px-3 py-1.5 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${team.primary}, ${team.accent})`,
                color: team.ink,
                boxShadow: `0 8px 22px -10px ${team.primary}`,
              }}
            >
              ✓ Following
            </span>
          ) : (
            <button
              onClick={() => setTeamCode(team.code)}
              className="font-display uppercase tracking-[0.2em] text-[11px] px-3 py-1.5 rounded-full chip-glow"
            >
              + Follow
            </button>
          )}
          <span className="text-[11px] uppercase tracking-[0.18em] font-display text-[color:var(--ink-faint)] ml-1">
            {views.length} fixtures
          </span>
        </div>
      </section>

      {/* News strip */}
      <NewsStrip team={team} />

      {/* Stars roster */}
      {stars.length > 0 && (
        <section>
          <Heading label="Stars" accent />
          <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 pb-1">
              {stars.map((name) => (
                <PlayerCard
                  key={name}
                  name={name}
                  nationality={team.name}
                  team={team}
                  onOpen={setOpenPlayer}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Next match */}
      {next && (
        <section>
          <Heading label="Next match" accent />
          <MatchCard m={next} highlight />
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > (next ? 1 : 0) && (
        <section>
          <Heading label="Upcoming" />
          <div className="space-y-2">
            {upcoming.slice(next ? 1 : 0).map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {/* Past results */}
      {played.length > 0 && (
        <section>
          <Heading label="Results" />
          <div className="space-y-2">
            {played.map((m) => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!err && fixtures && views.length === 0 && (
        <div className="card-dim p-4 text-sm text-[color:var(--ink-dim)]">
          No fixtures available for {team.name} yet.
        </div>
      )}
      {err && (
        <div className="card-dim p-4 text-sm text-[color:var(--ink-dim)]">
          Couldn&apos;t load fixtures for {team.name}.
        </div>
      )}

      {!fixtures && !err && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-dim h-[88px] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      )}

      <PlayerSheet player={openPlayer} team={team} onClose={() => setOpenPlayer(null)} />
    </div>
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
