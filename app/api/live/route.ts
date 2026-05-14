import { NextResponse } from "next/server";
import { getLive } from "@/lib/data";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "edge";

export async function GET(req: Request) {
  const rl = checkRateLimit(req);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  try {
    const data = await getLive();
    return NextResponse.json({ ok: true, count: data.length, matches: data });
  } catch {
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}
