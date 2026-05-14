import raw from "@/data/worldcup-2026.json";
import { parseKickoffMs } from "./datetime";

type RawMatch = {
  round: string;
  num?: number;
  date: string;
  time?: string;
  team1: string;
  team2: string;
  ground?: string;
};

const RAW = raw as { matches: RawMatch[] };

export type BracketRound = "R32" | "R16" | "QF" | "SF" | "3RD" | "F";

const ROUND_MAP: Record<string, BracketRound> = {
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarter-final": "QF",
  "Semi-final": "SF",
  "Match for third place": "3RD",
  "Final": "F",
};

export const ROUND_LABELS: Record<BracketRound, string> = {
  R32: "Round of 32",
  R16: "Round of 16",
  QF: "Quarter-finals",
  SF: "Semi-finals",
  "3RD": "Third place",
  F: "Final",
};

export const ROUND_ORDER: BracketRound[] = ["R32", "R16", "QF", "SF", "3RD", "F"];

export type BracketMatch = {
  num: number;        // openfootball match number, 73+ for knockouts
  round: BracketRound;
  date: string;
  kickoffMs: number;
  venue?: string;
  slot1: string;      // raw placeholder ("2A" / "W73" / "L101")
  slot2: string;
};

// Auto-number knockout matches that don't have `num` (third-place + final use W101/W102)
const KNOCKOUTS: BracketMatch[] = (() => {
  const out: BracketMatch[] = [];
  let auto = 100; // numbers 100+ for matches without explicit num
  for (const m of RAW.matches) {
    const round = ROUND_MAP[m.round];
    if (!round) continue;
    out.push({
      num: m.num ?? ++auto,
      round,
      date: m.date,
      kickoffMs: parseKickoffMs({ date: m.date, time: m.time }),
      venue: m.ground,
      slot1: m.team1,
      slot2: m.team2,
    });
  }
  return out.sort((a, b) => a.num - b.num);
})();

export const BRACKET: BracketMatch[] = KNOCKOUTS;

export function byRound(r: BracketRound): BracketMatch[] {
  return KNOCKOUTS.filter((k) => k.round === r);
}

// Predictions map { matchNum: "slot1" | "slot2" } stored in localStorage.
export type Prediction = "slot1" | "slot2";
export type Predictions = Record<number, Prediction>;

export const STORAGE_KEY = "wc26.bracket";

// Given predictions, resolve a placeholder slot ("W73" / "L101" / "1A") to
// either a concrete predicted slot value or the original placeholder.
export function resolveSlot(slot: string, preds: Predictions): string {
  // "1A".."2L" / "3A/E/H/I/J/K" — group results aren't predictable here, leave as-is
  if (/^[1-3][A-L]/.test(slot)) return slot;
  if (slot.startsWith("3")) return slot;

  // "W73" / "L101" — look up the underlying match num
  const m = /^([WL])(\d+)$/.exec(slot);
  if (!m) return slot;
  const isWinner = m[1] === "W";
  const num = parseInt(m[2], 10);
  const pick = preds[num];
  if (!pick) return slot; // no prediction yet
  const src = KNOCKOUTS.find((k) => k.num === num);
  if (!src) return slot;
  // Resolve the picked slot recursively
  const winnerSlot = pick === "slot1" ? src.slot1 : src.slot2;
  const loserSlot  = pick === "slot1" ? src.slot2 : src.slot1;
  const target = isWinner ? winnerSlot : loserSlot;
  return resolveSlot(target, preds);
}
