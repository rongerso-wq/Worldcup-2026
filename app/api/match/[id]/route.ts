import { NextResponse } from "next/server";
import { getMatch } from "@/lib/data";

export const runtime = "edge";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
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
