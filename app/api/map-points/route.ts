import { NextResponse } from "next/server";
import { runtimeConfig } from "@/src/lib/config";
import { capturedMapFeed } from "@/src/lib/data";
import type { MapFeed } from "@/src/lib/data";
import { fetchUsgsMapPoints } from "@/src/lib/providers/usgs";

export const dynamic = "force-dynamic";

const snapshotCache = { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" };
const degradedCache = { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" };

export async function GET() {
  const config = runtimeConfig();
  if (!config.usgsLiveDataEnabled) {
    return NextResponse.json(capturedMapFeed(), { headers: snapshotCache });
  }

  try {
    const points = (await fetchUsgsMapPoints({ apiKey: config.usgsApiKey })).slice(0, 60);
    const feed: MapFeed = {
      mode: "live-preview",
      source: "USGS latest-continuous, monitoring-locations, and time-series-metadata",
      fetchedAt: new Date().toISOString(),
      capturedAt: null,
      degraded: false,
      notice: "Live source preview. Series, depth, qualifier, and approval metadata remain visible; candidate mappings are not published station snapshots.",
      points,
    };
    return NextResponse.json(feed, { headers: snapshotCache });
  } catch {
    const feed: MapFeed = {
      ...capturedMapFeed(),
      degraded: true,
      notice: "The live USGS preview is unavailable. Showing the dated source snapshot without claiming current conditions.",
    };
    return NextResponse.json(feed, { headers: degradedCache });
  }
}
