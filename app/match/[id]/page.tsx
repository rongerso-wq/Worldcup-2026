"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { findTeamByName, type Team } from "@/lib/teams";
import {
  parseKickoffMs,
  formatIsraelTime,
  formatIsraelDate,
} from "@/lib/datetime";
import IsometricPitch from "@/components/match/IsometricPitch";
import MatchHero from "@/components/match/MatchHero";

type ApiMatch = {
  id: string;
  date: string;
  kickoffISO?: string;
  time?: string;
  venue?: string;
  group?: string;
  round?: string;
  status: "scheduled" | "live" | "finished";
  home: { name: string };
  away: { name: string };
  homeScore: number | null;
  awayScore: number | null;
};

type TabKey = "pitch" | "lineups" | "stats" | "summary";

export default function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [data, setData] = useState<ApiMatch | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("pitch");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/match/${id}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (!j.ok) {
          setErr(j.error || "not_found");
          return;
        }
        setData(j.match);
      })
      .catch((e) => !cancelled && setErr(String(e)));
    return () => { cancelled = true; };
  }, [id]);

  if (err) {
    return (
      <div className="card-dim p-5 space-y-3">
        <div className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
          {id}
        </div>
        <h1 className="font-display uppercase tracking-wider text-2xl text-[color:var(--hot)]">
          Match not found
        </h1>
        <Link href="/" className="inline-block font-display uppercase tracking-wider text-[11px] chip-glow rounded-full px-3 py-1.5">
          ← Back to today
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-3">
        <div className="card-dim h-44 animate-pulse" />
        <div className="card-dim h-12 animate-pulse" />
        <div className="card-dim h-72 animate-pulse" />
      </div>
    );
  }

  const home = findTeamByName(data.home.name);
  const away = findTeamByName(data.away.name);

  if (!home || !away) {
    return (
      <div className="card-dim p-5 space-y-2">
        <div className="font-display uppercase tracking-wider text-lg">
          {data.home.name} vs {data.away.name}
        </div>
        <p className="text-sm text-[color:var(--ink-dim)]">
          One side is still to be determined ({data.round ?? ""}).
        </p>
        <Link href="/" className="inline-block mt-2 font-display uppercase tracking-wider text-[11px] chip-glow rounded-full px-3 py-1.5">
          ← Back
        </Link>
      </div>
    );
  }

  const kt = parseKickoffMs(data);

  return (
    <div className="space-y-4">
      <Link
        href="/"
        className="inline-flex items-center gap-1 font-display uppercase tracking-[0.18em] text-[11px] text-[color:var(--ink-dim)]"
      >
        ← back
      </Link>

      <MatchHero match={data} home={home} away={away} kickoffMs={kt} />

      <TabBar tab={tab} setTab={setTab} />

      <div className="min-h-[260px]">
        {tab === "pitch" && <PitchTab home={home} away={away} />}
        {tab === "lineups" && <LineupsTab home={home} away={away} status={data.status} />}
        {tab === "stats" && <StatsTab status={data.status} />}
        {tab === "summary" && (
          <SummaryTab match={data} home={home} away={away} kickoffMs={kt} />
        )}
      </div>
    </div>
  );
}

function TabBar({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: "pitch", label: "Pitch" },
    { key: "lineups", label: "Lineups" },
    { key: "stats", label: "Stats" },
    { key: "summary", label: "Summary" },
  ];
  return (
    <div
      className="rounded-full p-1 flex items-center gap-1"
      style={{
        background: "color-mix(in oklab, var(--bg-card) 50%, transparent)",
        border: "1px solid color-mix(in oklab, white 8%, transparent)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {tabs.map((t) => {
        const active = tab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 rounded-full py-2 text-[11px] font-display uppercase tracking-[0.18em] transition-transform active:scale-95"
            style={{
              background: active
                ? `linear-gradient(135deg, var(--team-primary), var(--team-accent))`
                : "transparent",
              color: active ? "var(--team-ink)" : "var(--ink-dim)",
              boxShadow: active
                ? "0 8px 22px -10px color-mix(in oklab, var(--team-primary) 70%, transparent)"
                : "none",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function PitchTab({ home, away }: { home: Team; away: Team }) {
  return (
    <div className="space-y-3">
      <IsometricPitch home={home} away={away} formationHome="4-3-3" formationAway="4-3-3" />
      <div className="card-dim p-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] font-display">
        <span>
          <Dot color={home.primary} /> {home.code} <span className="text-[color:var(--ink-faint)] ml-1">4-3-3</span>
        </span>
        <span className="text-[color:var(--ink-faint)]">vs</span>
        <span>
          <span className="text-[color:var(--ink-faint)] mr-1">4-3-3</span> {away.code} <Dot color={away.primary} />
        </span>
      </div>
      <Note>Formations shown are placeholders — confirmed XI lands ~1 hr before kickoff.</Note>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full align-middle"
      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
    />
  );
}

function LineupsTab({
  home,
  away,
  status,
}: {
  home: Team;
  away: Team;
  status: "scheduled" | "live" | "finished";
}) {
  return (
    <div className="space-y-3">
      <div className="card-dim p-4 text-center">
        <div className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)] mb-2">
          {status === "scheduled" ? "starting XI" : "Lineups"}
        </div>
        <p className="text-sm text-[color:var(--ink-dim)]">
          {status === "scheduled"
            ? "Confirmed XI published ~1 hour before kickoff."
            : "Player-level data wiring in next phase."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormationCard team={home} formation="4-3-3" />
        <FormationCard team={away} formation="4-3-3" />
      </div>
    </div>
  );
}

function FormationCard({ team, formation }: { team: Team; formation: string }) {
  return (
    <div
      className="rounded-2xl p-3 clip-fifa flex flex-col items-center gap-2"
      style={{
        background: `linear-gradient(180deg, ${team.primary} 0%, color-mix(in oklab, ${team.primary} 60%, var(--bg-card)) 100%)`,
        color: team.ink,
        border: `1px solid ${team.primary}`,
        boxShadow: `0 14px 30px -16px ${team.primary}`,
      }}
    >
      <span className="text-2xl">{team.flag}</span>
      <span className="font-display uppercase tracking-wider text-lg leading-none">{team.code}</span>
      <span className="font-display uppercase tracking-[0.22em] text-[10px] opacity-80">{formation}</span>
    </div>
  );
}

function StatsTab({ status }: { status: "scheduled" | "live" | "finished" }) {
  return (
    <div className="space-y-3">
      <div className="card-dim p-4">
        <div className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)] mb-3">
          Match stats
        </div>
        {status === "scheduled" ? (
          <p className="text-sm text-[color:var(--ink-dim)]">
            Possession, shots, xG, cards and more appear once the match kicks off.
          </p>
        ) : (
          <p className="text-sm text-[color:var(--ink-dim)]">Live stats integration coming next phase.</p>
        )}
        <div className="mt-4 space-y-2">
          {["Possession", "Shots", "Shots on target", "xG", "Corners", "Fouls"].map((label) => (
            <StatRow key={label} label={label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[10px] tabular-nums w-8 text-right text-[color:var(--ink-faint)]">—</span>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden flex" style={{ background: "color-mix(in oklab, var(--line) 70%, transparent)" }}>
        <span className="block h-full w-1/2" style={{ background: "color-mix(in oklab, var(--team-primary) 25%, transparent)" }} />
        <span className="block h-full w-1/2" style={{ background: "color-mix(in oklab, var(--team-accent) 25%, transparent)" }} />
      </div>
      <span className="font-mono text-[10px] tabular-nums w-8 text-[color:var(--ink-faint)]">—</span>
      <span className="font-display uppercase tracking-[0.18em] text-[10px] w-24 text-[color:var(--ink-dim)] text-center">{label}</span>
    </div>
  );
}

function SummaryTab({
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
  const utcLabel = new Date(kickoffMs).toUTCString().replace(/^.+?, /, "");
  return (
    <div className="space-y-3">
      <FactCard label="Kickoff">
        <div className="flex items-baseline gap-2">
          <span className="score-num text-3xl tabular-nums">{formatIsraelTime(kickoffMs)}</span>
          <span className="font-display uppercase tracking-[0.18em] text-[10px] text-[color:var(--ink-faint)]">IL · {formatIsraelDate(kickoffMs)}</span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-[color:var(--ink-faint)] tabular-nums">{utcLabel} UTC</div>
      </FactCard>
      <FactCard label="Venue">{match.venue ?? "TBD"}</FactCard>
      <FactCard label="Stage">
        {match.group ?? "—"} · {match.round ?? "—"}
      </FactCard>
      <FactCard label="Teams">
        <span style={{ color: home.primary }}>{home.name}</span>
        <span className="mx-2 text-[color:var(--ink-faint)]">vs</span>
        <span style={{ color: away.primary }}>{away.name}</span>
      </FactCard>
    </div>
  );
}

function FactCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card-dim p-4">
      <div className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)] mb-1">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2 text-[11px] text-[color:var(--ink-faint)] leading-relaxed">
      {children}
    </div>
  );
}
