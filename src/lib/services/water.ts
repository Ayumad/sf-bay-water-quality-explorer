import {
  capturedMapFeed,
  getStation,
  type MapFeed,
  type MapPoint,
} from "@/src/lib/data";
import { runtimeConfig } from "@/src/lib/config";
import { fetchUsgsMapPoints } from "@/src/lib/providers/usgs";

type SavedFeed = { feed: MapFeed; expiresAt: number };
let saved: SavedFeed | undefined;
let pending: Promise<MapFeed> | undefined;

export function stationPoint(feed: MapFeed, slug: string): MapPoint | null {
  const station = getStation(slug);
  return station
    ? (feed.points.find((point) => point.id === station.providerId) ?? null)
    : null;
}

// Saved successful responses are reusable within a warm server instance. The
// captured source fixture remains available across cold starts; neither changes
// measurement collection times. Durable persistence is optional in the SFDS.
export async function loadWaterFeed(
  options: {
    live?: boolean;
    fetchPoints?: typeof fetchUsgsMapPoints;
    previous?: MapFeed;
    useCache?: boolean;
  } = {},
): Promise<MapFeed> {
  const config = runtimeConfig();
  if (!(options.live ?? config.usgsLiveDataEnabled)) return capturedMapFeed();
  const useCache = options.useCache ?? !options.fetchPoints;
  if (useCache && saved && saved.expiresAt > Date.now()) return saved.feed;
  if (useCache && pending) return pending;
  const run = async (): Promise<MapFeed> => {
    try {
      const points = await (options.fetchPoints ?? fetchUsgsMapPoints)({
        apiKey: config.usgsApiKey,
      });
      // A successful empty result is an empty result, not an invented reading or outage.
      const feed: MapFeed = {
        mode: "live-preview",
        source: "USGS Water Data",
        fetchedAt: new Date().toISOString(),
        capturedAt: null,
        degraded: false,
        points,
        notice: points.length
          ? "Latest available source readings. Check the collection date on each reading."
          : "The source returned no available readings. Station selection and learning guides remain available.",
      };
      if (useCache) saved = { feed, expiresAt: Date.now() + 300_000 };
      return feed;
    } catch {
      if (process.env.NODE_ENV !== "test")
        console.warn(
          JSON.stringify({
            module: "M2",
            provider: "USGS",
            event: "provider_unavailable",
            fallback: true,
          }),
        );
      const previous = options.previous ?? saved?.feed ?? capturedMapFeed();
      return {
        ...previous,
        degraded: true,
        notice:
          "The water-data provider is unavailable. Showing saved readings with their original collection dates; they may be out of date.",
      };
    }
  };
  if (!useCache) return run();
  pending = run();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
