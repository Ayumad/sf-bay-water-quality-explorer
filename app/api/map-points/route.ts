import { NextResponse } from "next/server";
import { loadWaterFeed } from "@/src/lib/services/water";
export const dynamic = "force-dynamic";
export async function GET() {
  const feed = await loadWaterFeed();
  return NextResponse.json(feed, {
    headers: {
      "Cache-Control": feed.degraded
        ? "public, max-age=30"
        : "public, max-age=300, stale-while-revalidate=900",
    },
  });
}
