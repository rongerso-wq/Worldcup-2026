import { NextResponse } from "next/server";
import { getLive } from "@/lib/data";

export const runtime = "edge";

export async function GET() {
  try {
    const data = await getLive();
    return NextResponse.json({ ok: true, count: data.length, matches: data });
  } catch {
    return NextResponse.json({ ok: false, error: "fetch_failed" }, { status: 502 });
  }
}
