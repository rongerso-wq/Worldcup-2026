"use client";

import { TEAM_LIST } from "@/lib/teams";
import { useTeamTheme } from "./JerseyThemeProvider";

export default function TeamPickerStrip() {
  const { team, hasTeam, setTeamCode, clearTeam } = useTeamTheme();
  return (
    <div className="-mx-4 px-4">
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {/* No-team chip — first */}
        <button
          onClick={clearTeam}
          className="shrink-0 h-11 px-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-transform active:scale-95 clip-fifa"
          style={{
            background: !hasTeam
              ? "linear-gradient(135deg, #5DA5C5, #7C8AA8)"
              : "var(--bg-card)",
            color: !hasTeam ? "#FFFFFF" : "var(--ink)",
            border: `1px solid ${!hasTeam ? "#5DA5C5" : "var(--line)"}`,
            boxShadow: !hasTeam ? "0 8px 22px -10px #5DA5C5" : "none",
          }}
          aria-label="No team selected"
        >
          <span className="text-base leading-none" aria-hidden>✕</span>
          <span className="uppercase tracking-wider font-display text-[13px]">None</span>
        </button>

        {TEAM_LIST.map((t) => {
          const active = hasTeam && t.code === team.code;
          return (
            <button
              key={t.code}
              onClick={() => setTeamCode(t.code)}
              className="shrink-0 h-11 px-3 rounded-xl flex items-center gap-2 text-sm font-medium transition-transform active:scale-95 clip-fifa"
              style={{
                background: active
                  ? `linear-gradient(135deg, ${t.primary}, ${t.accent})`
                  : "var(--bg-card)",
                color: active ? t.ink : "var(--ink)",
                border: `1px solid ${active ? t.primary : "var(--line)"}`,
                boxShadow: active ? `0 8px 22px -10px ${t.primary}` : "none",
              }}
            >
              <span className="text-base leading-none">{t.flag}</span>
              <span className="uppercase tracking-wider font-display text-[13px]">{t.code}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
