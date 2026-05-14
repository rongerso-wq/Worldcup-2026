"use client";

import { SmokeBackground } from "@/components/ui/spooky-smoke-animation";
import { useTeamTheme } from "./JerseyThemeProvider";

export default function ThemedSmokeBackground() {
  const { team } = useTeamTheme();
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      <SmokeBackground
        smokeColor={team.primary}
        smokeColor2={team.primary}
        smokeColor3={team.primary}
      />
      {/* dim veil so cards/text stay legible on bright jerseys */}
      <div className="absolute inset-0 bg-black/35" />
      {/* edge vignettes keep chrome (top bar, nav) clean */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[color:var(--bg-deep)] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[color:var(--bg-deep)] to-transparent" />
    </div>
  );
}
