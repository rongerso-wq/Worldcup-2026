"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MatchCard, { toView, type MatchView } from "@/components/MatchCard";
import { useTeamTheme } from "@/components/JerseyThemeProvider";
import { israelIsoDate } from "@/lib/datetime";

type ApiMatch = Parameters<typeof toView>[0];
type ApiResponse = { ok: boolean; matches: ApiMatch[] };

type Filter = "all" | "mine" | "live";

// Build a stable noon-UTC timestamp from a YYYY-MM-DD so the date-rail
// chip labels render the right weekday/day/month in Israel time.
function isoNoonMs(iso: string): number {
  return Date.parse(iso + "T12:00:00Z");
}
function dayLabel(iso: string) {
  return new Date(isoNoonMs(iso))
    .toLocaleDateString("en-US", { weekday: "short", timeZone: "Asia/Jerusalem" })
    .toUpperCase();
}
function dayNum(iso: string) {
  return new Date(isoNoonMs(iso)).toLocaleDateString("en-US", { day: "numeric", timeZone: "Asia/Jerusalem" });
}
function monthShort(iso: string) {
  return new Date(isoNoonMs(iso))
    .toLocaleDateString("en-US", { month: "short", timeZone: "Asia/Jerusalem" })
    .toUpperCase();
}

function todayIsoIL(): string {
  return israelIsoDate(Date.now());
}

export default function MatchesPage() {
  const { team, hasTeam } = useTeamTheme();
  const [matches, setMatches] = useState<MatchView[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fixtures")
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((j) => {
        if (cancelled) return;
        const real = (j.matches ?? [])
          .map(toView)
          .filter((m): m is MatchView => !!m)
          .sort((a, b) => a.kt - b.kt);
        setMatches(real);
      })
      .catch((e) => !cancelled && setErr(String(e)));
    return () => { cancelled = true; };
  }, []);

  const dates = useMemo<string[]>(() => {
    if (!matches) return [];
    // group by Israel-local date so the rail aligns with what the user sees
    return Array.from(new Set(matches.map((m) => m.ilDate))).sort();
  }, [matches]);

  // Auto-select: today if any matches today, else first upcoming, else first
  useEffect(() => {
    if (selectedDate || !dates.length) return;
    const t = todayIsoIL();
    const today = dates.find((d) => d === t);
    const upcoming = dates.find((d) => d >= t);
    setSelectedDate(today ?? upcoming ?? dates[0]);
  }, [dates, selectedDate]);

  // Scroll the active date chip into view once when ready
  useEffect(() => {
    if (!selectedDate || !dateRef.current) return;
    const el = dateRef.current.querySelector<HTMLElement>(`[data-date="${selectedDate}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedDate]);

  const visible = useMemo(() => {
    if (!matches || !selectedDate) return [];
    return matches
      .filter((m) => m.ilDate === selectedDate)
      .filter((m) => {
        if (filter === "all") return true;
        if (filter === "mine") return hasTeam && (m.home.code === team.code || m.away.code === team.code);
        if (filter === "live") return m.status === "live";
        return true;
      });
  }, [matches, selectedDate, filter, team.code, hasTeam]);

  if (err) {
    return (
      <div className="card-dim p-4">
        <div className="text-sm text-[color:var(--ink-dim)]">Couldn&apos;t load fixtures.</div>
      </div>
    );
  }

  if (!matches) {
    return (
      <div className="space-y-3">
        <div className="card-dim h-16 animate-pulse" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-dim h-[88px] animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between px-1">
        <div>
          <h1 className="font-display uppercase tracking-wider text-3xl leading-none" style={{ color: "var(--team-primary)" }}>
            Matches
          </h1>
          <p className="text-[11px] uppercase tracking-[0.22em] font-display text-[color:var(--ink-faint)] mt-1">
            {matches.length} fixtures · {dates.length} matchdays · times in IL 🇮🇱
          </p>
        </div>
      </header>

      {/* date rail */}
      <div ref={dateRef} className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 pb-1">
          {dates.map((iso) => {
            const active = iso === selectedDate;
            return (
              <button
                key={iso}
                data-date={iso}
                onClick={() => setSelectedDate(iso)}
                className="shrink-0 rounded-2xl flex flex-col items-center justify-center px-3 py-2 min-w-[58px] transition-transform active:scale-95"
                style={{
                  background: active
                    ? `linear-gradient(160deg, var(--team-primary), var(--team-accent))`
                    : "color-mix(in oklab, var(--bg-card) 50%, transparent)",
                  color: active ? "var(--team-ink)" : "var(--ink)",
                  border: `1px solid ${
                    active
                      ? "var(--team-primary)"
                      : "color-mix(in oklab, white 8%, transparent)"
                  }`,
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  boxShadow: active
                    ? "0 12px 28px -14px color-mix(in oklab, var(--team-primary) 65%, transparent)"
                    : "none",
                }}
              >
                <span className="font-display uppercase tracking-[0.18em] text-[9px] opacity-80">
                  {dayLabel(iso)}
                </span>
                <span className="score-num text-2xl leading-none">{dayNum(iso)}</span>
                <span className="font-display uppercase tracking-[0.18em] text-[9px] opacity-80 -mt-0.5">
                  {monthShort(iso)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* filter chips */}
      <div className="flex gap-2 px-1">
        <FilterChip label="All" active={filter === "all"} onClick={() => setFilter("all")} />
        <FilterChip
          label={hasTeam ? `My team · ${team.code}` : "My team"}
          active={filter === "mine"}
          onClick={() => setFilter("mine")}
          disabled={!hasTeam}
        />
        <FilterChip label="Live" active={filter === "live"} onClick={() => setFilter("live")} />
      </div>

      {/* list */}
      {visible.length > 0 ? (
        <div className="space-y-2">
          {visible.map((m) => (
            <MatchCard
              key={m.id}
              m={m}
              highlight={hasTeam && (m.home.code === team.code || m.away.code === team.code)}
              showDate={false}
            />
          ))}
        </div>
      ) : (
        <div className="card-dim p-4 text-sm text-[color:var(--ink-dim)]">
          {filter === "mine" ? `No ${team.code} matches on this day.` : "No matches on this day."}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className="rounded-full px-3 py-1.5 font-display uppercase tracking-[0.18em] text-[11px] transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: active
          ? `linear-gradient(135deg, var(--team-primary), var(--team-accent))`
          : "color-mix(in oklab, var(--bg-card) 50%, transparent)",
        color: active ? "var(--team-ink)" : "var(--ink-dim)",
        border: `1px solid ${
          active ? "var(--team-primary)" : "color-mix(in oklab, white 8%, transparent)"
        }`,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      {label}
    </button>
  );
}
