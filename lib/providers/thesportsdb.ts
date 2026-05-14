import type { Match, Player } from "@/lib/types";
import { fetchJson } from "@/lib/fetch-limited";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";
const WC_LEAGUE_ID = "4429"; // FIFA World Cup
const MAX_BYTES = 2_000_000;       // 2 MB cap on TheSportsDB responses
const TIMEOUT_MS = 8_000;

type SDBEvent = {
  idEvent: string;
  strEvent: string;
  intRound?: string;
  dateEvent: string;
  strTimestamp?: string;
  strTime?: string;
  strHomeTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strHomeTeamBadge?: string;
  strAwayTeamBadge?: string;
  strLeagueBadge?: string;
  strVenue?: string;
  strStatus?: string;
  strProgress?: string | null;
};

function mapStatus(e: SDBEvent): Match["status"] {
  if (e.intHomeScore != null && e.intAwayScore != null) return "finished";
  const s = (e.strStatus || "").toLowerCase();
  if (s.includes("live") || s.includes("ht") || s.includes("1h") || s.includes("2h")) return "live";
  return "scheduled";
}

function toMatch(e: SDBEvent): Match {
  return {
    id: `sdb-${e.idEvent}`,
    round: e.intRound ? `Matchday ${e.intRound}` : "—",
    date: e.dateEvent,
    kickoffISO: e.strTimestamp || undefined,
    time: e.strTime,
    venue: e.strVenue,
    home: { name: e.strHomeTeam, badge: e.strHomeTeamBadge },
    away: { name: e.strAwayTeam, badge: e.strAwayTeamBadge },
    homeScore: e.intHomeScore != null ? Number(e.intHomeScore) : null,
    awayScore: e.intAwayScore != null ? Number(e.intAwayScore) : null,
    status: mapStatus(e),
    leagueBadge: e.strLeagueBadge,
    source: "thesportsdb",
  };
}

export async function fetchSeason(season = "2026"): Promise<Match[]> {
  const url = `${BASE}/eventsseason.php?id=${WC_LEAGUE_ID}&s=${season}`;
  const r = await fetchJson<{ events: SDBEvent[] | null }>(url, {
    maxBytes: MAX_BYTES,
    timeoutMs: TIMEOUT_MS,
  });
  if (!r.ok || !r.data) throw new Error("upstream_failed");
  return (r.data.events ?? []).map(toMatch);
}

export async function fetchOn(date: string): Promise<Match[]> {
  const all = await fetchSeason("2026");
  return all.filter((m) => m.date === date);
}

export async function fetchLive(): Promise<Match[]> {
  const url = `${BASE}/livescore.php?l=Soccer`;
  const r = await fetchJson<{ events: SDBEvent[] | null }>(url, {
    maxBytes: MAX_BYTES,
    timeoutMs: TIMEOUT_MS,
  });
  if (!r.ok || !r.data) return [];
  return (r.data.events ?? [])
    .filter((e) => e && (e as { idLeague?: string }).idLeague === WC_LEAGUE_ID)
    .map(toMatch);
}

type SDBPlayer = {
  idPlayer: string;
  strPlayer: string;
  strPlayerAlternate?: string;
  strNationality?: string;
  strPosition?: string;
  strTeam?: string;
  strThumb?: string;
  strCutout?: string;
  dateBorn?: string;
  strHeight?: string;
  strBirthLocation?: string;
  strDescriptionEN?: string;
};

function toPlayer(p: SDBPlayer): Player {
  return {
    id: p.idPlayer,
    name: p.strPlayer,
    altName: p.strPlayerAlternate || undefined,
    nationality: p.strNationality || undefined,
    position: p.strPosition || undefined,
    club: p.strTeam || undefined,
    photoUrl: p.strThumb || undefined,
    cutoutUrl: p.strCutout || undefined,
    born: p.dateBorn || undefined,
    height: p.strHeight || undefined,
    birthplace: p.strBirthLocation || undefined,
    bioEn: p.strDescriptionEN || undefined,
  };
}

// Find a player by name, optionally filtered by nationality (TheSportsDB
// `strNationality`). Returns best match or undefined.
export async function fetchPlayer(
  name: string,
  nationality?: string,
): Promise<Player | undefined> {
  const url = `${BASE}/searchplayers.php?p=${encodeURIComponent(name)}`;
  const r = await fetchJson<{ player: SDBPlayer[] | null }>(url, {
    maxBytes: MAX_BYTES,
    timeoutMs: TIMEOUT_MS,
  });
  if (!r.ok || !r.data) return undefined;
  const rows = r.data.player ?? [];
  if (rows.length === 0) return undefined;
  if (nationality) {
    const exact = rows.find(
      (row) => row.strNationality?.toLowerCase() === nationality.toLowerCase(),
    );
    if (exact) return toPlayer(exact);
  }
  const exactName = rows.find(
    (row) => row.strPlayer?.toLowerCase() === name.toLowerCase(),
  );
  return toPlayer(exactName ?? rows[0]);
}

export async function fetchEvent(idEvent: string): Promise<Match | undefined> {
  const url = `${BASE}/lookupevent.php?id=${idEvent}`;
  const r = await fetchJson<{ events: SDBEvent[] | null }>(url, {
    maxBytes: MAX_BYTES,
    timeoutMs: TIMEOUT_MS,
  });
  if (!r.ok || !r.data) return undefined;
  const e = r.data.events?.[0];
  return e ? toMatch(e) : undefined;
}
