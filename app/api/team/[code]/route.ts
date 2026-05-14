import { NextResponse } from "next/server";
import { getTeamFixtures } from "@/lib/data";
import { getTeam } from "@/lib/teams";

export const runtime = "edge";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  if (typeof code !== "string" || code.length > 8) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  const team = getTeam(code.toUpperCase());
  try {
    const fixtures = await getTeamFixtures(team.name);
    return NextResponse.json({
      ok: true,
      team: { code: team.code, name: team.name, flag: team.flag },
      count: fixtures.length,
      fixtures,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}
