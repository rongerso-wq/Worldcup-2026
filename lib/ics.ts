// RFC 5545 iCalendar builder. Generates a single-file VCALENDAR with one
// VEVENT per match. Keeps lines under 75 octets, uses CRLF line endings,
// and UTC timestamps for cross-app compatibility (Google Calendar, Apple
// Calendar, Outlook all import the same file).

import type { Match } from "./types";
import { parseKickoffMs } from "./datetime";

const MATCH_DURATION_MS = 2 * 60 * 60_000; // 90 min + halftime + extra-time buffer
const PRODID = "-//Floating Lighthouse//WC2026//EN";

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toIcsDateUTC(ms: number): string {
  const d = new Date(ms);
  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcsText(s: string): string {
  // RFC 5545 §3.3.11: escape backslash, comma, semicolon, newline.
  return s
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

// Fold any line longer than 75 octets per RFC 5545 §3.1: CRLF + single space.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let i = 0;
  parts.push(line.slice(0, 75));
  i = 75;
  while (i < line.length) {
    parts.push(line.slice(i, i + 74));
    i += 74;
  }
  return parts.join("\r\n ");
}

export type IcsMatchInput = {
  match: Match;
  ourTeam: { code: string; name: string };
};

export function buildIcs(matches: IcsMatchInput[]): string {
  const now = toIcsDateUTC(Date.now());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const { match, ourTeam } of matches) {
    const startMs = parseKickoffMs(match);
    const endMs = startMs + MATCH_DURATION_MS;
    const opponent =
      match.home.name === ourTeam.name ? match.away.name : match.home.name;
    const venue = match.venue ?? "TBD";
    const labelGroup = match.group ? `Group ${match.group}` : match.round;
    const summary = escapeIcsText(`${ourTeam.name} vs ${opponent} — ${labelGroup}`);
    const description = escapeIcsText(
      `${ourTeam.name} vs ${opponent}\n${labelGroup} · WC 2026\nVenue: ${venue}`,
    );

    lines.push(
      "BEGIN:VEVENT",
      foldLine(`UID:${match.id}@floating-lighthouse`),
      `DTSTAMP:${now}`,
      `DTSTART:${toIcsDateUTC(startMs)}`,
      `DTEND:${toIcsDateUTC(endMs)}`,
      foldLine(`SUMMARY:${summary}`),
      foldLine(`LOCATION:${escapeIcsText(venue)}`),
      foldLine(`DESCRIPTION:${description}`),
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
