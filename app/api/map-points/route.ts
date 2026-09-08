import { NextResponse } from "next/server";
import type { MapMeasurement, MapPoint, MetricKey } from "@/src/lib/data";
import { fallbackMapPoints } from "@/src/lib/data";

const BBOX = "-122.58,37.35,-121.72,38.25";
const BASE = "https://api.waterdata.usgs.gov/ogcapi/v0/collections";
const supportedParameters: Record<string, MetricKey> = {
  "00010": "temperature",
  "00300": "dissolvedOxygen",
  "00400": "ph",
  "63680": "turbidity",
  "00095": "conductivity",
};

type Feature = {
  id?: string;
  geometry?: { coordinates?: [number, number] | null } | null;
  properties?: {
    monitoring_location_id?: string;
    parameter_code?: string;
    value?: string | null;
    unit_of_measure?: string | null;
    time?: string | null;
    approval_status?: string | null;
    qualifier?: string | null;
  };
};

type LocationFeature = {
  id?: string;
  geometry?: { coordinates?: [number, number] | null } | null;
  properties?: { monitoring_location_name?: string; site_type?: string; site_type_code?: string };
};

function freshness(time: string | null): MapMeasurement["freshness"] {
  if (!time) return "unavailable";
  const ageDays = (Date.now() - new Date(time).getTime()) / 86_400_000;
  if (ageDays <= 3) return "recent";
  if (ageDays <= 90) return "older";
  return "archive";
}

function newestByTime(features: Feature[]) {
  const bySeries = new Map<string, Feature>();
  for (const feature of features) {
    const properties = feature.properties;
    const locationId = properties?.monitoring_location_id;
    const parameter = properties?.parameter_code;
    const time = properties?.time ?? null;
    const value = properties?.value;
    if (!locationId || !parameter || !supportedParameters[parameter] || value === null || value === undefined || !time) continue;
    const key = `${locationId}:${parameter}`;
    const current = bySeries.get(key);
    if (!current || new Date(time).getTime() > new Date(current.properties?.time ?? 0).getTime()) bySeries.set(key, feature);
  }
  return bySeries;
}

export async function GET() {
  try {
    const query = `bbox=${BBOX}&limit=500&f=json`;
    const [latestResponse, locationsResponse] = await Promise.all([
      fetch(`${BASE}/latest-continuous/items?${query}`, { next: { revalidate: 300 } }),
      fetch(`${BASE}/monitoring-locations/items?${query}`, { next: { revalidate: 3600 } }),
    ]);
    if (!latestResponse.ok || !locationsResponse.ok) throw new Error("USGS source request failed");
    const latest = await latestResponse.json() as { features?: Feature[] };
    const locations = await locationsResponse.json() as { features?: LocationFeature[] };
    const locationById = new Map((locations.features ?? []).map((location) => [location.id ?? "", location]));
    const bySeries = newestByTime(latest.features ?? []);
    const byLocation = new Map<string, MapPoint>();

    for (const feature of bySeries.values()) {
      const properties = feature.properties;
      const id = properties?.monitoring_location_id;
      const coordinates = feature.geometry?.coordinates;
      const parameter = properties?.parameter_code;
      if (!id || !coordinates || !parameter || !supportedParameters[parameter]) continue;
      const location = locationById.get(id);
      const [lng, lat] = coordinates;
      const point = byLocation.get(id) ?? {
        id,
        name: location?.properties?.monitoring_location_name ?? id,
        siteType: location?.properties?.site_type ?? location?.properties?.site_type_code ?? "Monitoring location",
        lat,
        lng,
        source: "USGS continuous",
        sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${id}/`,
        lastUpdated: null,
        measurements: [],
      } satisfies MapPoint;
      const time = properties.time ?? null;
      if (!point.lastUpdated || (time && new Date(time).getTime() > new Date(point.lastUpdated).getTime())) point.lastUpdated = time;
      point.measurements.push({
        key: supportedParameters[parameter],
        value: properties.value === null || properties.value === undefined ? null : Number(properties.value),
        unit: properties.unit_of_measure ?? "source unit",
        time,
        approvalStatus: properties.approval_status,
        qualifier: properties.qualifier,
        freshness: freshness(time),
      });
      byLocation.set(id, point);
    }

    const points = [...byLocation.values()]
      .sort((a, b) => new Date(b.lastUpdated ?? 0).getTime() - new Date(a.lastUpdated ?? 0).getTime())
      .slice(0, 60);
    return NextResponse.json({ source: "USGS latest-continuous + monitoring-locations", fetchedAt: new Date().toISOString(), points }, {
      headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=900" },
    });
  } catch (error) {
    return NextResponse.json({
      source: "USGS captured fallback snapshot",
      fetchedAt: new Date().toISOString(),
      degraded: true,
      error: "The live USGS station feed is temporarily unavailable; showing a dated source snapshot.",
      detail: error instanceof Error ? error.message : "unknown error",
      points: fallbackMapPoints,
    }, { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } });
  }
}
