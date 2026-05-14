export const TZ = "Asia/Jerusalem";

// TheSportsDB kickoffISO is bare "YYYY-MM-DDTHH:MM:SS" in UTC (no Z).
// openfootball time is "HH:MM UTC±N" with the stadium's UTC offset.
// Both reduce to a precise UTC millisecond epoch.
export function parseKickoffMs(input: {
  kickoffISO?: string;
  date: string;
  time?: string;
}): number {
  if (input.kickoffISO) {
    const ms = Date.parse(input.kickoffISO + "Z");
    if (!Number.isNaN(ms)) return ms;
  }
  if (input.time && input.date) {
    const m = /^(\d{1,2}):(\d{2})\s+UTC([+-]\d+(?::\d{2})?)$/.exec(input.time.trim());
    if (m) {
      const [, hh, mm, offRaw] = m;
      const [oH, oM = "0"] = offRaw.replace("+", "").split(":");
      const offMin = parseInt(oH, 10) * 60 + Math.sign(parseInt(oH, 10) || 1) * parseInt(oM, 10);
      const [y, mo, d] = input.date.split("-").map(Number);
      const utcMs = Date.UTC(y, mo - 1, d, parseInt(hh, 10), parseInt(mm, 10), 0);
      return utcMs - offMin * 60_000;
    }
  }
  // last resort — midnight UTC of the date
  return Date.parse(input.date + "T00:00:00Z");
}

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});

const dateShortFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: TZ,
});

const dayLabelFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: TZ,
});
const dayNumFmt = new Intl.DateTimeFormat("en-US", { day: "numeric", timeZone: TZ });
const monthShortFmt = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: TZ });

const isoDateFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TZ,
});

export const formatIsraelTime  = (ms: number) => timeFmt.format(new Date(ms));
export const formatIsraelDate  = (ms: number) => dateShortFmt.format(new Date(ms)).toUpperCase();
export const formatIsraelDay   = (ms: number) => dayLabelFmt.format(new Date(ms)).toUpperCase();
export const formatIsraelDayNum   = (ms: number) => dayNumFmt.format(new Date(ms));
export const formatIsraelMonthShort = (ms: number) => monthShortFmt.format(new Date(ms)).toUpperCase();
export const israelIsoDate     = (ms: number) => isoDateFmt.format(new Date(ms)); // YYYY-MM-DD
