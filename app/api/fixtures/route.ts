import { NextResponse } from "next/server";
import { getAllFixtures, getFixturesByDate } from "@/lib/data";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "edge";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const rl = checkRateLimit(req);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const url = new URL(req.url);
  const date = url.searchParams.get("date");
  if (date != null && !DATE_RE.test(date)) {
    return NextResponse.json({ ok: false, error: "bad_date" }, { status: 400 });
  }
  try {
    const data = date ? await getFixturesByDate(date) : await getAllFixtures();
    return NextResponse.json({ ok: true, count: data.length, date, matches: data });
  } catch {
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}
