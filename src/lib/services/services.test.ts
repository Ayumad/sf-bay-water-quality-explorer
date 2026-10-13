import { describe, expect, it, vi } from "vitest";
import { capturedMapFeed, getStation, stations } from "@/src/lib/data";
import { loadWaterFeed, stationPoint } from "./water";
import { loadWildlife, matchConservation, parseObservations } from "./wildlife";
import { GET as waterGET } from "@/app/api/stations/[slug]/measurements/route";
import { GET as wildlifeGET } from "@/app/api/stations/[slug]/wildlife/route";

const observation = {
  id: 456,
  observed_on: "2026-09-20",
  taxon: {
    id: 123,
    name: "Testus aquaticus",
    preferred_common_name: "Test bird",
    iconic_taxon_name: "Aves",
  },
  photos: [
    {
      url: "https://static.inaturalist.org/photos/1/square.jpg",
      attribution: "Photo by researcher",
      license_code: "cc-by",
    },
  ],
};
const statusPayload = {
  results: [
    {
      scientificName: "Testus aquaticus",
      uniqueId: "ELEMENT_GLOBAL.2.123",
      roundedGRank: "G2",
      speciesGlobal: { usesaCode: "LT" },
    },
  ],
};

describe("M1 station navigation", () => {
  it("resolves all configured stations without external data", () => {
    expect(stations).toHaveLength(9);
    for (const station of stations)
      expect(getStation(station.slug)?.providerId).toBe(station.providerId);
    expect(
      stations.find((item) => item.providerId === "USGS-11455780")?.name,
    ).toBe("Suisun Bay at Benicia Bridge");
    expect(
      stations.find((item) => item.providerId === "USGS-11162690")?.name,
    ).toBe("San Francisco Bay at Presidio");
  });
  it("rejects unknown/unsafe stations before provider requests", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const unknown = { params: Promise.resolve({ slug: "not-a-station" }) };
    expect(
      (await waterGET(new Request("https://example.com"), unknown)).status,
    ).toBe(404);
    expect(
      (
        await wildlifeGET(new Request("https://example.com"), {
          params: Promise.resolve({ slug: "../escape" }),
        })
      ).status,
    ).toBe(400);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
describe("M2 and M4 data integrity", () => {
  it("retains original timestamps and marks saved readings on outage", async () => {
    const previous = capturedMapFeed(new Date("2026-09-08"));
    const feed = await loadWaterFeed({
      live: true,
      useCache: false,
      previous,
      fetchPoints: async () => {
        throw new DOMException("Timed out", "TimeoutError");
      },
    });
    expect(feed.degraded).toBe(true);
    expect(feed.fetchedAt).toBe(previous.fetchedAt);
    expect(feed.points[0].measurements[0].time).toBe(
      previous.points[0].measurements[0].time,
    );
    expect(feed.notice).toContain("original collection dates");
  });
  it("treats a successful empty source as no data, not a failure", async () => {
    const feed = await loadWaterFeed({
      live: true,
      useCache: false,
      fetchPoints: async () => [],
    });
    expect(feed.points).toEqual([]);
    expect(feed.degraded).toBe(false);
    expect(feed.notice).toContain("no available readings");
  });
  it("preserves a real zero without inventing other measurements", async () => {
    const base = capturedMapFeed().points[0];
    const point = {
      ...base,
      measurements: [{ ...base.measurements[0], value: 0 }],
    };
    const feed = await loadWaterFeed({
      live: true,
      useCache: false,
      fetchPoints: async () => [point],
    });
    expect(stationPoint(feed, "san-mateo-bridge")?.measurements[0].value).toBe(
      0,
    );
    expect(stationPoint(feed, stations[1].slug)).toBeNull();
  });
});
describe("M3 wildlife and conservation boundaries", () => {
  it("deduplicates taxa and excludes malformed records", () => {
    const data = parseObservations({
      results: [
        observation,
        observation,
        { ...observation, observed_on: null },
        { taxon: null },
      ],
    });
    expect(data).toHaveLength(1);
    expect(data[0].status).toBeNull();
    expect(data[0]).not.toHaveProperty("coordinates");
  });
  it("does not display restricted/unlicensed photos or unexpected hosts", () => {
    expect(
      parseObservations({
        results: [
          {
            ...observation,
            photos: [
              { url: "https://static.inaturalist.org/a", license_code: null },
            ],
          },
        ],
      })[0].imageUrl,
    ).toBeNull();
    expect(
      parseObservations({
        results: [
          {
            ...observation,
            photos: [{ url: "https://evil.example/a", license_code: "cc-by" }],
          },
        ],
      })[0].imageUrl,
    ).toBeNull();
  });
  it("attaches only one exact scientific-name match, never a common-name match", () => {
    expect(
      matchConservation(statusPayload, observation.taxon.name)?.label,
    ).toBe("Federally threatened");
    expect(matchConservation(statusPayload, "Test bird")).toBeNull();
    expect(
      matchConservation(
        { results: [...statusPayload.results, ...statusPayload.results] },
        observation.taxon.name,
      ),
    ).toBeNull();
    expect(
      matchConservation({ results: [] }, observation.taxon.name),
    ).toBeNull();
  });
  it("retains observations when conservation requests fail", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (input) =>
        String(input).includes("inaturalist")
          ? new Response(JSON.stringify({ results: [observation] }))
          : new Response("Unavailable", { status: 503 }),
      );
    const result = await loadWildlife("san-mateo-bridge", {
      fetchImplementation: fetcher,
      now: new Date("2026-10-12"),
      useCache: false,
    });
    expect(result.isFallback).toBe(false);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].status).toBeNull();
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.searchParams.get("radius")).toBe("5");
    expect(url.searchParams.get("per_page")).toBe("50");
  });
  it("returns a readable message on wildlife outage, independently of water", async () => {
    const result = await loadWildlife("san-mateo-bridge", {
      fetchImplementation: async () => {
        throw new Error("Network error");
      },
      useCache: false,
    });
    expect(result.isFallback).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.message).toContain("Water measurements");
    expect(
      stationPoint(capturedMapFeed(), "san-mateo-bridge")?.measurements.length,
    ).toBeGreaterThan(0);
  });
});
