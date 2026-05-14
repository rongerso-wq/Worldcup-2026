import { NextResponse } from "next/server";
import { getMatch } from "@/lib/data";
import { checkRateLimit, rateLimitResponse } from "@/lib/ratelimit";

export const runtime = "edge";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const rl = checkRateLimit(req);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);
  const { id } = await ctx.params;
  if (typeof id !== "string" || id.length > 80) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  try {
    const match = await getMatch(id);
    if (!match) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, match });
  } catch {
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}
