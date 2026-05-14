import raw from "@/data/worldcup-2026.json";
import type { Match } from "@/lib/types";

type RawMatch = {
  round: string;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
  score?: { ft?: [number, number] };
};

const RAW = raw as { name: string; matches: RawMatch[] };

function deriveStatus(m: RawMatch): { status: Match["status"]; h: number | null; a: number | null } {
  if (m.score?.ft) {
    const [h, a] = m.score.ft;
    return { status: "finished", h, a };
  }
  return { status: "scheduled", h: null, a: null };
}

function id(m: RawMatch, i: number): string {
  return `of-${m.date}-${m.team1}-${m.team2}-${i}`.replace(/\s+/g, "_");
}

export function allMatches(): Match[] {
  return RAW.matches.map((m, i) => {
    const { status, h, a } = deriveStatus(m);
    return {
      id: id(m, i),
      round: m.round,
      group: m.group,
      date: m.date,
      time: m.time,
      venue: m.ground,
      home: { name: m.team1 },
      away: { name: m.team2 },
      homeScore: h,
      awayScore: a,
      status,
      source: "openfootball",
    };
  });
}

export function matchesOn(date: string): Match[] {
  return allMatches().filter((m) => m.date === date);
}

export function matchesForTeam(teamName: string): Match[] {
  const n = teamName.toLowerCase();
  return allMatches().filter(
    (m) => m.home.name.toLowerCase() === n || m.away.name.toLowerCase() === n
  );
}

export function matchById(id: string): Match | undefined {
  return allMatches().find((m) => m.id === id);
}
