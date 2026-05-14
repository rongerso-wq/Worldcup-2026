import { cached } from "./cache";
import type { Match, Player } from "./types";
import * as OF from "./providers/openfootball";
import * as SDB from "./providers/thesportsdb";

const FIXTURES_TTL = 5 * 60_000;
const LIVE_TTL = 30_000;
const MATCH_TTL = 60_000;
const PLAYER_TTL = 24 * 60 * 60_000;

// Layered read: try TheSportsDB first (richer — badges, kickoff ISO, live).
// On failure, fall back to bundled openfootball schedule.
export async function getFixturesByDate(date: string): Promise<Match[]> {
  return cached(`fix:${date}`, FIXTURES_TTL, async () => {
    try {
      const live = await SDB.fetchOn(date);
      if (live.length) return live;
    } catch {}
    return OF.matchesOn(date);
  });
}

export async function getAllFixtures(): Promise<Match[]> {
  return cached("fix:all:2026", FIXTURES_TTL, async () => {
    const base = OF.allMatches();
    let enrich: Match[] = [];
    try { enrich = await SDB.fetchSeason("2026"); } catch {}
    if (!enrich.length) return base;
    // Index SDB matches by a normalized home+away+date key.
    const key = (m: Match) =>
      `${m.date}|${m.home.name.toLowerCase()}|${m.away.name.toLowerCase()}`;
    const sdbByKey = new Map(enrich.map((m) => [key(m), m]));
    return base.map((b) => {
      const hit = sdbByKey.get(key(b));
      if (!hit) return b;
      // Prefer SDB's richer fields, keep openfootball's id (so URLs are stable).
      return {
        ...b,
        kickoffISO: hit.kickoffISO ?? b.kickoffISO,
        venue: hit.venue ?? b.venue,
        time: hit.time ?? b.time,
        home: { ...b.home, badge: hit.home.badge ?? b.home.badge },
        away: { ...b.away, badge: hit.away.badge ?? b.away.badge },
        leagueBadge: hit.leagueBadge ?? b.leagueBadge,
        homeScore: hit.homeScore ?? b.homeScore,
        awayScore: hit.awayScore ?? b.awayScore,
        status: hit.status !== "scheduled" ? hit.status : b.status,
      };
    });
  });
}

export async function getLive(): Promise<Match[]> {
  return cached("live", LIVE_TTL, async () => {
    try { return await SDB.fetchLive(); } catch { return []; }
  });
}

export async function getMatch(id: string): Promise<Match | undefined> {
  return cached(`match:${id}`, MATCH_TTL, async () => {
    // Resolve through the merged list so OF matches pick up SDB venue/kickoff
    // and SDB matches still work directly.
    const all = await getAllFixtures();
    const hit = all.find((m) => m.id === id);
    if (hit) return hit;
    if (id.startsWith("sdb-")) {
      const m = await SDB.fetchEvent(id.replace(/^sdb-/, ""));
      if (m) return m;
    }
    if (id.startsWith("of-")) {
      return OF.matchById(id);
    }
    return undefined;
  });
}

export async function getPlayer(
  name: string,
  nationality?: string
): Promise<Player | undefined> {
  const key = `player:${nationality?.toLowerCase() ?? "-"}:${name.toLowerCase()}`;
  return cached(key, PLAYER_TTL, async () => {
    try { return await SDB.fetchPlayer(name, nationality); } catch { return undefined; }
  });
}

export async function getTeamFixtures(teamName: string): Promise<Match[]> {
  return cached(`team:${teamName.toLowerCase()}`, FIXTURES_TTL, async () => {
    const all = await getAllFixtures(); // merged (openfootball base + SDB enrichment)
    const n = teamName.toLowerCase();
    return all.filter(
      (m) => m.home.name.toLowerCase() === n || m.away.name.toLowerCase() === n
    );
  });
}
