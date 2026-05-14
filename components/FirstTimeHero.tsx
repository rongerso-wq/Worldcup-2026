"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TEAM_LIST } from "@/lib/teams";
import { useTeamTheme } from "./JerseyThemeProvider";

const SESSION_KEY = "wc26.heroDismissed";

const POPULAR_CODES = ["BRA", "ARG", "ENG", "FRA", "ESP", "GER"] as const;

export default function FirstTimeHero() {
  const { setTeamCode } = useTeamTheme();
  const [dismissed, setDismissed] = useState<boolean>(false);

  // Skippable + persists for the session — picking a team also hides via parent gate.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setDismissed(true);
    } catch {}
  }, []);

  if (dismissed) return null;

  const popular = POPULAR_CODES
    .map((c) => TEAM_LIST.find((t) => t.code === c))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const dismiss = () => {
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <section
      className="card-dim relative px-4 py-3"
      aria-label="Pick your team to theme the app"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss — stay in neutral mode"
        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-[color:var(--ink-dim)] hover:text-[color:var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--team-ink-hi)]"
      >
        <span aria-hidden className="text-base leading-none">×</span>
      </button>
      <div className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)]">
        first time here
      </div>
      <h2 className="font-display uppercase tracking-wider text-lg mt-1 leading-tight pr-8">
        Pick a team — the app repaints in your colors.
      </h2>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {popular.map((t) => (
          <button
            key={t.code}
            type="button"
            onClick={() => setTeamCode(t.code)}
            className="h-9 px-2.5 rounded-lg flex items-center gap-1.5 text-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--team-ink-hi)]"
            style={{
              background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
              color: t.ink,
              border: `1px solid ${t.primary}`,
            }}
            aria-label={`Pick ${t.name}`}
          >
            <span className="text-base leading-none">{t.flag}</span>
            <span className="font-display uppercase tracking-wider text-[12px]">{t.code}</span>
          </button>
        ))}
        <Link
          href="/teams"
          className="h-9 px-2.5 rounded-lg flex items-center font-display uppercase tracking-[0.18em] text-[11px] text-[color:var(--team-primary)] border border-[color:color-mix(in_oklab,var(--team-primary)_40%,transparent)]"
        >
          See all 48 →
        </Link>
      </div>
    </section>
  );
}
