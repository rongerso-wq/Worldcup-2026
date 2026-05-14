export type MatchStatus = "scheduled" | "live" | "finished";

export type TeamSlim = {
  name: string;
  code?: string;
  badge?: string;
};

export type Player = {
  id: string;          // SDB idPlayer
  name: string;
  altName?: string;
  nationality?: string;
  position?: string;
  club?: string;
  photoUrl?: string;   // strThumb / strCutout
  cutoutUrl?: string;  // strCutout (transparent if available)
  born?: string;       // ISO date
  height?: string;
  birthplace?: string;
  bioEn?: string;
};

export type Match = {
  id: string;
  round: string;
  group?: string;
  date: string;          // ISO date (YYYY-MM-DD)
  kickoffISO?: string;   // full ISO timestamp if available
  time?: string;         // local label, e.g. "13:00 UTC-6"
  venue?: string;
  home: TeamSlim;
  away: TeamSlim;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  minute?: number | null;
  leagueBadge?: string;
  source: "openfootball" | "thesportsdb" | "apifootball";
};
