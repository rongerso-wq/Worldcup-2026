"use client";

import Link from "next/link";
import { useTeamTheme } from "./JerseyThemeProvider";

export default function TopBar() {
  const { team, hasTeam } = useTeamTheme();
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[color:var(--bg-deep)]/70 border-b border-[color:var(--line)]">
      <div className="mx-auto max-w-md flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 group">
          <span
            aria-hidden
            className="relative inline-flex items-center justify-center w-7 h-7 rounded-md clip-fifa-l"
            style={{
              background: `linear-gradient(135deg, var(--team-primary), var(--team-accent))`,
            }}
          >
            <span className="absolute inset-[3px] rounded-[4px] bg-[color:var(--bg-deep)]" />
            <span
              className="relative score-num text-[15px]"
              style={{ color: "var(--team-primary)" }}
            >
              26
            </span>
          </span>
          <span className="score-num text-lg tracking-wide uppercase">
            <span style={{ color: "var(--team-primary)" }}>World</span>
            <span className="text-ink-dim">Cup</span>
          </span>
        </Link>

        <Link
          href="/teams"
          className="chip-glow rounded-full px-3 h-9 flex items-center gap-2 text-sm font-medium clip-fifa"
        >
          {hasTeam ? (
            <>
              <span className="text-base leading-none">{team.flag}</span>
              <span className="uppercase font-display tracking-wider text-xs">{team.code}</span>
            </>
          ) : (
            <span className="uppercase font-display tracking-wider text-xs">Pick team</span>
          )}
        </Link>
      </div>
    </header>
  );
}
