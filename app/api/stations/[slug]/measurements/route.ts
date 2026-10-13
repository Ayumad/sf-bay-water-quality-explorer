import { NextResponse } from "next/server";
import { getStation } from "@/src/lib/data";
import { loadWaterFeed, stationPoint } from "@/src/lib/services/water";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug))
    return NextResponse.json({ error: "Invalid station" }, { status: 400 });
  const station = getStation(slug);
  if (!station)
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  const feed = await loadWaterFeed();
  return NextResponse.json(
    {
      station,
      data: stationPoint(feed, slug)?.measurements ?? [],
      isFallback: feed.degraded || feed.mode === "captured-snapshot",
      mode: feed.mode,
      retrievedAt: feed.fetchedAt,
      capturedAt: feed.capturedAt,
      message: feed.notice,
    },
    { headers: { "Cache-Control": "public, max-age=60" } },
  );
}
