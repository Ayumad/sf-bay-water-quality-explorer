import { NextResponse } from "next/server";
import { stations } from "@/src/lib/data";
export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.length > 100)
    return NextResponse.json(
      { error: "Search terms must be 100 characters or fewer" },
      { status: 400 },
    );
  const key = query.trim().toLowerCase();
  const matches = stations.filter((station) =>
    `${station.name} ${station.region}`.toLowerCase().includes(key),
  );
  return NextResponse.json(
    {
      stations: matches.map(
        ({ slug, providerId, name, region, coordinates, type, sourceUrl }) => ({
          slug,
          providerId,
          name,
          region,
          coordinates,
          type,
          sourceUrl,
        }),
      ),
    },
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
