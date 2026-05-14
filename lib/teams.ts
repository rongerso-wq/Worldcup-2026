export type TeamCode = string;

export type Confederation = "UEFA" | "CONMEBOL" | "CONCACAF" | "AFC" | "CAF" | "OFC";

export const CONFEDERATIONS: Confederation[] = [
  "UEFA",
  "CONMEBOL",
  "CONCACAF",
  "AFC",
  "CAF",
  "OFC",
];

export type Team = {
  code: TeamCode;
  name: string;     // must match the openfootball schedule name (case-insensitive)
  flag: string;
  confederation?: Confederation; // undefined only for the neutral placeholder
  primary: string;
  secondary: string;
  accent: string;
  ink: string;      // readable foreground when surface is in jersey color
};

export const TEAMS: Record<TeamCode, Team> = {
  ALG: { code: "ALG", name: "Algeria",               flag: "🇩🇿", confederation: "CAF",      primary: "#006633", secondary: "#FFFFFF", accent: "#DA251D", ink: "#FFFFFF" },
  ARG: { code: "ARG", name: "Argentina",             flag: "🇦🇷", confederation: "CONMEBOL", primary: "#75AADB", secondary: "#FFFFFF", accent: "#F6B40E", ink: "#0A1A2A" },
  AUS: { code: "AUS", name: "Australia",             flag: "🇦🇺", confederation: "AFC",      primary: "#FFCD00", secondary: "#00843D", accent: "#012169", ink: "#0A0A0A" },
  AUT: { code: "AUT", name: "Austria",               flag: "🇦🇹", confederation: "UEFA",     primary: "#ED2939", secondary: "#FFFFFF", accent: "#000000", ink: "#FFFFFF" },
  BEL: { code: "BEL", name: "Belgium",               flag: "🇧🇪", confederation: "UEFA",     primary: "#E30613", secondary: "#FFD700", accent: "#000000", ink: "#FFFFFF" },
  BIH: { code: "BIH", name: "Bosnia & Herzegovina",  flag: "🇧🇦", confederation: "UEFA",     primary: "#002F6C", secondary: "#FECB00", accent: "#FFFFFF", ink: "#FFFFFF" },
  BRA: { code: "BRA", name: "Brazil",                flag: "🇧🇷", confederation: "CONMEBOL", primary: "#FEDF00", secondary: "#009C3B", accent: "#002776", ink: "#101010" },
  CAN: { code: "CAN", name: "Canada",                flag: "🇨🇦", confederation: "CONCACAF", primary: "#D52B1E", secondary: "#FFFFFF", accent: "#1A1A1A", ink: "#FFFFFF" },
  CPV: { code: "CPV", name: "Cape Verde",            flag: "🇨🇻", confederation: "CAF",      primary: "#003893", secondary: "#FFFFFF", accent: "#CF2027", ink: "#FFFFFF" },
  COL: { code: "COL", name: "Colombia",              flag: "🇨🇴", confederation: "CONMEBOL", primary: "#FCD116", secondary: "#003893", accent: "#CE1126", ink: "#0A0A0A" },
  CRO: { code: "CRO", name: "Croatia",               flag: "🇭🇷", confederation: "UEFA",     primary: "#FF0000", secondary: "#FFFFFF", accent: "#171796", ink: "#FFFFFF" },
  CUW: { code: "CUW", name: "Curaçao",               flag: "🇨🇼", confederation: "CONCACAF", primary: "#002B7F", secondary: "#F9E814", accent: "#FFFFFF", ink: "#FFFFFF" },
  CZE: { code: "CZE", name: "Czech Republic",        flag: "🇨🇿", confederation: "UEFA",     primary: "#D7141A", secondary: "#FFFFFF", accent: "#11457E", ink: "#FFFFFF" },
  COD: { code: "COD", name: "DR Congo",              flag: "🇨🇩", confederation: "CAF",      primary: "#007FFF", secondary: "#FFD700", accent: "#CE1126", ink: "#FFFFFF" },
  ECU: { code: "ECU", name: "Ecuador",               flag: "🇪🇨", confederation: "CONMEBOL", primary: "#FFDD00", secondary: "#034EA2", accent: "#ED1C24", ink: "#0A0A0A" },
  EGY: { code: "EGY", name: "Egypt",                 flag: "🇪🇬", confederation: "CAF",      primary: "#CE1126", secondary: "#FFFFFF", accent: "#000000", ink: "#FFFFFF" },
  ENG: { code: "ENG", name: "England",               flag: "🏴", confederation: "UEFA",     primary: "#CE1124", secondary: "#FFFFFF", accent: "#1A237E", ink: "#FFFFFF" },
  FRA: { code: "FRA", name: "France",                flag: "🇫🇷", confederation: "UEFA",     primary: "#1F3A93", secondary: "#FFFFFF", accent: "#E1000F", ink: "#FFFFFF" },
  GER: { code: "GER", name: "Germany",               flag: "🇩🇪", confederation: "UEFA",     primary: "#DD0000", secondary: "#FFCE00", accent: "#1C1C1C", ink: "#FFFFFF" },
  GHA: { code: "GHA", name: "Ghana",                 flag: "🇬🇭", confederation: "CAF",      primary: "#FFD700", secondary: "#006B3F", accent: "#CE1126", ink: "#0A0A0A" },
  HAI: { code: "HAI", name: "Haiti",                 flag: "🇭🇹", confederation: "CONCACAF", primary: "#00209F", secondary: "#D21034", accent: "#FFFFFF", ink: "#FFFFFF" },
  IRN: { code: "IRN", name: "Iran",                  flag: "🇮🇷", confederation: "AFC",      primary: "#239F40", secondary: "#FFFFFF", accent: "#DA0000", ink: "#FFFFFF" },
  IRQ: { code: "IRQ", name: "Iraq",                  flag: "🇮🇶", confederation: "AFC",      primary: "#CE1126", secondary: "#FFFFFF", accent: "#000000", ink: "#FFFFFF" },
  CIV: { code: "CIV", name: "Ivory Coast",           flag: "🇨🇮", confederation: "CAF",      primary: "#F77F00", secondary: "#FFFFFF", accent: "#009E60", ink: "#FFFFFF" },
  JPN: { code: "JPN", name: "Japan",                 flag: "🇯🇵", confederation: "AFC",      primary: "#0B1F8C", secondary: "#FFFFFF", accent: "#BC002D", ink: "#FFFFFF" },
  JOR: { code: "JOR", name: "Jordan",                flag: "🇯🇴", confederation: "AFC",      primary: "#007A3D", secondary: "#FFFFFF", accent: "#CE1126", ink: "#FFFFFF" },
  MEX: { code: "MEX", name: "Mexico",                flag: "🇲🇽", confederation: "CONCACAF", primary: "#006847", secondary: "#FFFFFF", accent: "#CE1126", ink: "#FFFFFF" },
  MAR: { code: "MAR", name: "Morocco",               flag: "🇲🇦", confederation: "CAF",      primary: "#C1272D", secondary: "#006233", accent: "#FFFFFF", ink: "#FFFFFF" },
  NED: { code: "NED", name: "Netherlands",           flag: "🇳🇱", confederation: "UEFA",     primary: "#FF6C00", secondary: "#21468B", accent: "#FFFFFF", ink: "#1A0E00" },
  NZL: { code: "NZL", name: "New Zealand",           flag: "🇳🇿", confederation: "OFC",      primary: "#CC142B", secondary: "#000000", accent: "#FFFFFF", ink: "#FFFFFF" },
  NOR: { code: "NOR", name: "Norway",                flag: "🇳🇴", confederation: "UEFA",     primary: "#BA0C2F", secondary: "#FFFFFF", accent: "#00205B", ink: "#FFFFFF" },
  PAN: { code: "PAN", name: "Panama",                flag: "🇵🇦", confederation: "CONCACAF", primary: "#DA121A", secondary: "#005AA7", accent: "#FFFFFF", ink: "#FFFFFF" },
  PAR: { code: "PAR", name: "Paraguay",              flag: "🇵🇾", confederation: "CONMEBOL", primary: "#D52B1E", secondary: "#FFFFFF", accent: "#0038A8", ink: "#FFFFFF" },
  POR: { code: "POR", name: "Portugal",              flag: "🇵🇹", confederation: "UEFA",     primary: "#046A38", secondary: "#DA291C", accent: "#FFD100", ink: "#FFFFFF" },
  QAT: { code: "QAT", name: "Qatar",                 flag: "🇶🇦", confederation: "AFC",      primary: "#8A1538", secondary: "#FFFFFF", accent: "#C5A572", ink: "#FFFFFF" },
  KSA: { code: "KSA", name: "Saudi Arabia",          flag: "🇸🇦", confederation: "AFC",      primary: "#006C35", secondary: "#FFFFFF", accent: "#C5A572", ink: "#FFFFFF" },
  SCO: { code: "SCO", name: "Scotland",              flag: "🏴", confederation: "UEFA",     primary: "#0065BD", secondary: "#FFFFFF", accent: "#1B4F8E", ink: "#FFFFFF" },
  SEN: { code: "SEN", name: "Senegal",               flag: "🇸🇳", confederation: "CAF",      primary: "#00853F", secondary: "#FDEF42", accent: "#E31B23", ink: "#FFFFFF" },
  RSA: { code: "RSA", name: "South Africa",          flag: "🇿🇦", confederation: "CAF",      primary: "#007749", secondary: "#FFB915", accent: "#DE3831", ink: "#FFFFFF" },
  KOR: { code: "KOR", name: "South Korea",           flag: "🇰🇷", confederation: "AFC",      primary: "#C8102E", secondary: "#003478", accent: "#FFFFFF", ink: "#FFFFFF" },
  ESP: { code: "ESP", name: "Spain",                 flag: "🇪🇸", confederation: "UEFA",     primary: "#AA151B", secondary: "#F1BF00", accent: "#0B1C36", ink: "#FFFFFF" },
  SWE: { code: "SWE", name: "Sweden",                flag: "🇸🇪", confederation: "UEFA",     primary: "#006AA7", secondary: "#FECC00", accent: "#FFFFFF", ink: "#FFFFFF" },
  SUI: { code: "SUI", name: "Switzerland",           flag: "🇨🇭", confederation: "UEFA",     primary: "#DA291C", secondary: "#FFFFFF", accent: "#000000", ink: "#FFFFFF" },
  TUN: { code: "TUN", name: "Tunisia",               flag: "🇹🇳", confederation: "CAF",      primary: "#E70013", secondary: "#FFFFFF", accent: "#000000", ink: "#FFFFFF" },
  TUR: { code: "TUR", name: "Turkey",                flag: "🇹🇷", confederation: "UEFA",     primary: "#E30A17", secondary: "#FFFFFF", accent: "#000000", ink: "#FFFFFF" },
  USA: { code: "USA", name: "USA",                   flag: "🇺🇸", confederation: "CONCACAF", primary: "#0A3161", secondary: "#FFFFFF", accent: "#B31942", ink: "#FFFFFF" },
  URU: { code: "URU", name: "Uruguay",               flag: "🇺🇾", confederation: "CONMEBOL", primary: "#5CBFEB", secondary: "#FFFFFF", accent: "#FFD700", ink: "#0A1A2A" },
  UZB: { code: "UZB", name: "Uzbekistan",            flag: "🇺🇿", confederation: "AFC",      primary: "#1EB53A", secondary: "#0099B5", accent: "#CE1126", ink: "#FFFFFF" },
};

export const TEAM_LIST: Team[] = Object.values(TEAMS).sort((a, b) =>
  a.name.localeCompare(b.name)
);

// Neutral / "no team" placeholder. Used when the user hasn't picked anyone.
// Cool silver-blue palette — feels like neutral floodlight, not a "team".
export const NEUTRAL_TEAM: Team = {
  code: "—",
  name: "No team",
  flag: "⚽",
  primary: "#5DA5C5",
  secondary: "#E2E8F0",
  accent: "#7C8AA8",
  ink: "#FFFFFF",
};

export const DEFAULT_TEAM = NEUTRAL_TEAM;

export function getTeam(code: string | undefined | null): Team {
  if (!code) return DEFAULT_TEAM;
  const upper = code.toUpperCase();
  if (TEAMS[upper]) return TEAMS[upper];
  const byName = TEAM_LIST.find((t) => t.name.toLowerCase() === code.toLowerCase());
  return byName ?? DEFAULT_TEAM;
}

// Strict lookup — returns undefined if not a known WC2026 team. Use this
// when filtering live fixture data (which can contain placeholders like "1A").
export function findTeamByName(name: string | undefined | null): Team | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase();
  return TEAM_LIST.find((t) => t.name.toLowerCase() === lower);
}
