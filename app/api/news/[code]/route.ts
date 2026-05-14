import { NextResponse } from "next/server";
import { getTeam, NEUTRAL_TEAM } from "@/lib/teams";
import { fetchText, UpstreamTooLargeError } from "@/lib/fetch-limited";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "edge";

const MAX_XML_BYTES = 1_000_000;       // 1 MB cap on Google News RSS body
const MAX_FIELD_CHARS = 600;            // hard cap on title/link/source plucks
const MAX_DECODE_BYTES = 100_000;       // entity-decode never operates on > 100 KB

type Article = {
  title: string;
  link: string;
  pubDate: string;          // ISO
  source?: string;
};

function decodeEntities(s: string): string {
  // Hard cap input length to prevent pathological strings.
  const capped = s.length > MAX_DECODE_BYTES ? s.slice(0, MAX_DECODE_BYTES) : s;
  return capped
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return "";
      try { return String.fromCodePoint(code); } catch { return ""; }
    });
}

function pluck(xml: string, tag: string): string | undefined {
  // CDATA-aware single-tag pluck. Cap the captured group length to prevent
  // catastrophic backtracking on malformed upstream XML.
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]{0,${MAX_FIELD_CHARS}}?)(?:\\]\\]>)?<\\/${tag}>`,
  );
  const m = re.exec(xml);
  return m ? decodeEntities(m[1].trim()) : undefined;
}

function parseRss(xml: string, limit = 12): Article[] {
  const items: Article[] = [];
  // Bound the per-item block to 20KB to prevent backtracking on malformed feeds.
  const itemRe = /<item[^>]*>([\s\S]{0,20000}?)<\/item>/g;
  let m: RegExpExecArray | null;
  let iters = 0;
  while ((m = itemRe.exec(xml)) && items.length < limit && iters++ < 200) {
    const block = m[1];
    const title = pluck(block, "title");
    const link = pluck(block, "link");
    const pubRaw = pluck(block, "pubDate");
    // <source url="...">Name</source> — bound capture.
    const srcMatch = /<source[^>]*>([\s\S]{0,200}?)<\/source>/.exec(block);
    const source = srcMatch ? decodeEntities(srcMatch[1].trim()) : undefined;
    if (!title || !link) continue;
    const pubIso = pubRaw ? safeIso(pubRaw) : new Date().toISOString();
    items.push({ title, link, pubDate: pubIso, source });
  }
  return items;
}

function safeIso(s: string): string {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

const TTL_MS = 30 * 60_000;
const cache = new Map<string, { fetchedAt: number; items: Article[] }>();

async function fetchNews(query: string): Promise<Article[]> {
  const hit = cache.get(query);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit.items;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(
    query,
  )}&hl=en-US&gl=US&ceid=US:en`;
  const r = await fetchText(url, {
    headers: { "User-Agent": "Mozilla/5.0 (wc26)" },
    maxBytes: MAX_XML_BYTES,
    timeoutMs: 8_000,
  });
  if (!r.ok) throw new Error("upstream_failed");
  const items = parseRss(r.text);
  cache.set(query, { fetchedAt: Date.now(), items });
  return items;
}

export async function GET(
  req: Request,
  ctx: { params: Promise<{ code: string }> },
) {
  const rl = checkRateLimit(req);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const { code } = await ctx.params;
  // Length cap + whitelist check (team code is always 2-4 chars).
  if (typeof code !== "string" || code.length > 8) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const team = getTeam(code.toUpperCase());
  if (team.code === NEUTRAL_TEAM.code) {
    return NextResponse.json({ ok: false, error: "unknown_team" }, { status: 404 });
  }
  const query = `${team.name} national football team World Cup`;
  try {
    const items = await fetchNews(query);
    return NextResponse.json({
      ok: true,
      team: { code: team.code, name: team.name, flag: team.flag },
      count: items.length,
      articles: items,
    });
  } catch (err) {
    const status = err instanceof UpstreamTooLargeError ? 502 : 502;
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status });
  }
}
