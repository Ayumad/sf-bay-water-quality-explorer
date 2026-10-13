import { NextResponse } from "next/server";
import { getStation } from "@/src/lib/data";
import { loadWildlife } from "@/src/lib/services/wildlife";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/.test(slug))
    return NextResponse.json({ error: "Invalid station" }, { status: 400 });
  if (!getStation(slug))
    return NextResponse.json({ error: "Station not found" }, { status: 404 });
  const result = await loadWildlife(slug);
  return NextResponse.json(result, {
    headers: {
      "Cache-Control": result.isFallback
        ? "public, max-age=30"
        : "public, max-age=600",
    },
  });
}
