import { NextResponse } from "next/server";
import { getPlayer } from "@/lib/data";

export const runtime = "edge";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const nationality = url.searchParams.get("nationality") ?? undefined;
  if (!name || name.length > 80) {
    return NextResponse.json({ ok: false, error: "missing_name" }, { status: 400 });
  }
  if (nationality && nationality.length > 40) {
    return NextResponse.json({ ok: false, error: "bad_nationality" }, { status: 400 });
  }
  try {
    const p = await getPlayer(name, nationality);
    if (!p) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, player: p });
  } catch {
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}
