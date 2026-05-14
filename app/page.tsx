"use client";

import TeamPickerStrip from "@/components/TeamPickerStrip";
import TodayHero from "@/components/TodayHero";
import UpNextRail from "@/components/UpNextRail";
import NewsStrip from "@/components/NewsStrip";
import FirstTimeHero from "@/components/FirstTimeHero";
import { useTeamTheme } from "@/components/JerseyThemeProvider";

export default function Home() {
  const { team, hasTeam } = useTeamTheme();
  return (
    <div className="flex flex-col gap-6">
      {!hasTeam && <FirstTimeHero />}
      <TodayHero />
      <UpNextRail />
      {hasTeam && <NewsStrip team={team} />}
      <section>
        <h2 className="font-display uppercase tracking-[0.22em] text-[10px] text-[color:var(--ink-faint)] mb-2 px-1">
          {hasTeam ? "Switch jersey" : "Or pick from all 48"}
        </h2>
        <TeamPickerStrip />
      </section>
    </div>
  );
}
