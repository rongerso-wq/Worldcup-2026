"use client";

import Link from "next/link";
import { useTeamTheme } from "@/components/JerseyThemeProvider";

export default function MePage() {
  const { team, hasTeam, clearTeam } = useTeamTheme();
  return (
    <div className="space-y-4">
      <div className="card-dim p-5 clip-fifa">
        <div className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-faint)] font-display mb-2">
          {hasTeam ? "Following" : "Neutral mode"}
        </div>
        {hasTeam ? (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{team.flag}</span>
            <div className="flex-1">
              <div
                className="font-display uppercase tracking-wider text-2xl"
                style={{ color: "var(--team-primary)" }}
              >
                {team.name}
              </div>
              <div className="text-sm text-[color:var(--ink-dim)]">Theme persists across visits.</div>
            </div>
            <button
              onClick={clearTeam}
              className="font-display uppercase tracking-wider text-[11px] chip-glow rounded-full px-3 py-1.5"
            >
              Clear
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display uppercase tracking-wider text-2xl" style={{ color: "var(--team-primary)" }}>
                No team
              </div>
              <div className="text-sm text-[color:var(--ink-dim)]">Browsing all 48 nations equally.</div>
            </div>
            <Link
              href="/teams"
              className="font-display uppercase tracking-wider text-[11px] chip-glow rounded-full px-3 py-1.5"
            >
              Pick →
            </Link>
          </div>
        )}
      </div>

      <div className="card-dim p-4">
        <h2 className="font-display uppercase tracking-[0.18em] text-[11px] text-[color:var(--ink-faint)] mb-2">
          Coming
        </h2>
        <ul className="text-sm text-[color:var(--ink-dim)] space-y-1">
          <li>· Onboarding (team → rival → fav player) — Phase 5</li>
          <li>· News strip tuned to your team — Phase 8</li>
          <li>· Predict-bracket save state — Phase 7</li>
        </ul>
      </div>
    </div>
  );
}
