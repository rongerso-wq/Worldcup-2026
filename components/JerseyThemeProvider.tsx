"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DEFAULT_TEAM, NEUTRAL_TEAM, getTeam, type Team, type TeamCode } from "@/lib/teams";
import { haptics } from "@/lib/haptics";
import { pickInkHi } from "@/lib/contrast";

type ThemeCtx = {
  team: Team;
  hasTeam: boolean;
  setTeamCode: (code: TeamCode) => void;
  clearTeam: () => void;
};

const Ctx = createContext<ThemeCtx>({
  team: DEFAULT_TEAM,
  hasTeam: false,
  setTeamCode: () => {},
  clearTeam: () => {},
});

const STORAGE_KEY = "wc26.myTeam";

function applyTheme(team: Team) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--team-primary", team.primary);
  root.style.setProperty("--team-secondary", team.secondary);
  root.style.setProperty("--team-accent", team.accent);
  root.style.setProperty("--team-ink", team.ink);
  // Guaranteed-contrast foreground for surfaces tinted in primary/accent
  // (e.g. active filter chips, gradient pills). Falls back to team.ink elsewhere.
  root.style.setProperty("--team-ink-hi", pickInkHi(team.primary));
  root.dataset.team = team.code;
}

export function JerseyThemeProvider({ children }: { children: React.ReactNode }) {
  const [team, setTeam] = useState<Team>(NEUTRAL_TEAM);
  const [hasTeam, setHasTeam] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // Shape guard: must be a short A–Z code, not a JSON blob, not script.
      const valid =
        typeof stored === "string" &&
        stored.length > 0 &&
        stored.length <= 8 &&
        /^[A-Z—-]+$/.test(stored);
      if (valid && stored !== NEUTRAL_TEAM.code) {
        const t = getTeam(stored);
        if (t.code === NEUTRAL_TEAM.code) {
          // unknown code — purge bad value
          localStorage.removeItem(STORAGE_KEY);
          applyTheme(NEUTRAL_TEAM);
        } else {
          setTeam(t);
          setHasTeam(true);
          applyTheme(t);
        }
      } else {
        applyTheme(NEUTRAL_TEAM);
      }
    } catch {
      applyTheme(NEUTRAL_TEAM);
    }
  }, []);

  const setTeamCode = useCallback((code: TeamCode) => {
    const t = getTeam(code);
    setTeam(t);
    setHasTeam(true);
    applyTheme(t);
    haptics.select();
    try { localStorage.setItem(STORAGE_KEY, t.code); } catch {}
  }, []);

  const clearTeam = useCallback(() => {
    setTeam(NEUTRAL_TEAM);
    setHasTeam(false);
    applyTheme(NEUTRAL_TEAM);
    haptics.tap();
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ team, hasTeam, setTeamCode, clearTeam }}>{children}</Ctx.Provider>
  );
}

export function useTeamTheme() {
  return useContext(Ctx);
}
