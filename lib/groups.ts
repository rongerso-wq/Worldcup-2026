import raw from "@/data/worldcup-2026.json";

type RawMatch = {
  team1: string;
  team2: string;
  group?: string;
};

const RAW = raw as { matches: RawMatch[] };

// Build team-name → "Group X" lookup once from the openfootball schedule.
const TEAM_TO_GROUP = (() => {
  const map = new Map<string, string>();
  for (const m of RAW.matches) {
    if (!m.group) continue;
    if (!map.has(m.team1)) map.set(m.team1, m.group);
    if (!map.has(m.team2)) map.set(m.team2, m.group);
  }
  return map;
})();

// Returns just the letter — "A" instead of "Group A".
export function getGroupLetter(teamName: string): string | undefined {
  const full = TEAM_TO_GROUP.get(teamName);
  if (!full) return undefined;
  const m = /Group ([A-L])/.exec(full);
  return m ? m[1] : undefined;
}

export function getGroup(teamName: string): string | undefined {
  return TEAM_TO_GROUP.get(teamName);
}
