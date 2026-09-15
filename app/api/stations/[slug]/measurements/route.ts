import { NextResponse } from "next/server";
import { getStation, getStationSnapshot } from "@/src/lib/data";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) {
    return NextResponse.json({ error: "Invalid station slug" }, { status: 400 });
  }
  const station = getStation(slug);
  if (!station) return NextResponse.json({ error: "Unknown station" }, { status: 404 });
  return NextResponse.json(getStationSnapshot(station), {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
