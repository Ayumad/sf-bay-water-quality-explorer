import {
  getStationSlug,
  mapStationAllowlist,
  metricByParameterCode,
  publicStationName,
} from "@/src/lib/data";
import type {
  MapMeasurement,
  MapPoint,
  MeasurementFreshness,
  MetricKey,
} from "@/src/lib/data";

export const USGS_COLLECTIONS_BASE =
  "https://api.waterdata.usgs.gov/ogcapi/v0/collections";

type JsonRecord = Record<string, unknown>;

type LatestObservation = {
  seriesId: string;
  stationId: string;
  parameterCode: string;
  statisticId: string | null;
  rawValue: string | null;
  value: number | null;
  unit: string;
  time: string | null;
  approvalStatus: string | null;
  qualifiers: string[];
  lat: number;
  lng: number;
};

type SeriesMetadata = {
  id: string;
  stationId: string;
  depth: string | null;
  method: string | null;
};

type LocationMetadata = {
  id: string;
  name: string;
  siteType: string;
  lat: number | null;
  lng: number | null;
};

export type UsgsSeriesCandidate = {
  providerSeriesId: string;
  stationId: string;
  parameterCode: string;
  rawUnit: string;
  method?: string;
  depth?: string;
  cadence?: string;
};

export type NormalizedMeasurement = {
  providerResultId?: string;
  providerSeriesId: string;
  metric: MetricKey;
  rawValue: string;
  parsedValue: number | null;
  canonicalUnit: string | null;
  collectedAt: string | null;
  precision: "instant" | "date" | "unknown";
  qualifier?: string;
  provisional?: boolean;
  sourceUrl: string;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function coordinatePair(feature: JsonRecord): [number, number] | null {
  if (
    !isRecord(feature.geometry) ||
    !Array.isArray(feature.geometry.coordinates)
  )
    return null;
  const [lng, lat] = feature.geometry.coordinates;
  return typeof lng === "number" &&
    Number.isFinite(lng) &&
    typeof lat === "number" &&
    Number.isFinite(lat)
    ? [lng, lat]
    : null;
}

function featureRecords(payload: unknown, collectionName: string) {
  if (!isRecord(payload) || !Array.isArray(payload.features)) {
    throw new Error(
      `USGS ${collectionName} response did not contain a feature collection`,
    );
  }
  return payload.features.filter(isRecord);
}

function normalizeQualifiers(value: unknown) {
  if (typeof value === "string" && value.trim()) return [value.trim()];
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is string =>
        typeof item === "string" && Boolean(item.trim()),
    )
    .map((item) => item.trim());
}

export function normalizeUsgsValue(input: string): number | null {
  if (!input.trim()) return null;
  const value = Number(input.trim());
  return Number.isFinite(value) ? value : null;
}

export function normalizeUsgsUnit(unit: string | null) {
  if (!unit) return "Source unit not supplied";
  const normalized = unit.replace(/^_/, "").trim();
  if (normalized.toLowerCase() === "degc") return "°C";
  if (normalized.toLowerCase() === "mg/l") return "mg/L";
  if (normalized.toLowerCase() === "us/cm") return "µS/cm";
  return normalized;
}

export function assertUsgsHost(url: string) {
  const parsed = new URL(url);
  if (
    parsed.protocol !== "https:" ||
    parsed.hostname !== "api.waterdata.usgs.gov"
  ) {
    throw new Error("Upstream host is not on the USGS API allowlist");
  }
}

export function measurementFreshness(
  time: string | null,
  now = new Date(),
): MeasurementFreshness {
  if (!time) return "unavailable";
  const timestamp = new Date(time).getTime();
  if (!Number.isFinite(timestamp)) return "unavailable";
  const ageDays = (now.getTime() - timestamp) / 86_400_000;
  if (ageDays <= 3) return "recent";
  if (ageDays <= 90) return "older";
  return "archive";
}

function parseLatest(payload: unknown): LatestObservation[] {
  return featureRecords(payload, "latest-continuous").flatMap((feature) => {
    if (!isRecord(feature.properties)) return [];
    const properties = feature.properties;
    const coordinates = coordinatePair(feature);
    const seriesId = stringValue(properties.time_series_id);
    const stationId = stringValue(properties.monitoring_location_id);
    const parameterCode = stringValue(properties.parameter_code);
    if (
      !coordinates ||
      !seriesId ||
      !stationId ||
      !parameterCode ||
      !metricByParameterCode.has(parameterCode)
    )
      return [];
    const time = stringValue(properties.time);
    const unit = stringValue(properties.unit_of_measure);
    if (!time || !Number.isFinite(Date.parse(time)) || !unit) return [];
    const rawValue = stringValue(properties.value);
    return [
      {
        seriesId,
        stationId,
        parameterCode,
        statisticId: stringValue(properties.statistic_id),
        rawValue,
        value: rawValue === null ? null : normalizeUsgsValue(rawValue),
        unit: normalizeUsgsUnit(unit),
        time,
        approvalStatus: stringValue(properties.approval_status),
        qualifiers: normalizeQualifiers(properties.qualifier),
        lng: coordinates[0],
        lat: coordinates[1],
      },
    ];
  });
}

function parseSeriesMetadata(payload: unknown) {
  const metadata = new Map<string, SeriesMetadata>();
  for (const feature of featureRecords(payload, "time-series-metadata")) {
    if (!isRecord(feature.properties)) continue;
    const id = stringValue(feature.id) ?? stringValue(feature.properties.id);
    const stationId = stringValue(feature.properties.monitoring_location_id);
    if (!id || !stationId) continue;
    metadata.set(id, {
      id,
      stationId,
      depth: stringValue(feature.properties.sublocation_identifier),
      method:
        stringValue(feature.properties.web_description) ??
        stringValue(feature.properties.computation_identifier),
    });
  }
  return metadata;
}

function parseLocations(payload: unknown) {
  const locations = new Map<string, LocationMetadata>();
  for (const feature of featureRecords(payload, "monitoring-locations")) {
    if (!isRecord(feature.properties)) continue;
    const id = stringValue(feature.id) ?? stringValue(feature.properties.id);
    if (!id) continue;
    const coordinates = coordinatePair(feature);
    locations.set(id, {
      id,
      name: stringValue(feature.properties.monitoring_location_name) ?? id,
      siteType:
        stringValue(feature.properties.site_type) ??
        stringValue(feature.properties.site_type_code) ??
        "Monitoring location",
      lng: coordinates?.[0] ?? null,
      lat: coordinates?.[1] ?? null,
    });
  }
  return locations;
}

export function buildUsgsMapPoints(
  latestPayload: unknown,
  locationsPayload: unknown,
  seriesPayload: unknown,
  options: { now?: Date; stationAllowlist?: readonly string[] } = {},
) {
  const now = options.now ?? new Date();
  const allowedStations = new Set(
    options.stationAllowlist ?? mapStationAllowlist,
  );
  const observations = parseLatest(latestPayload).filter((observation) =>
    allowedStations.has(observation.stationId),
  );
  const locations = parseLocations(locationsPayload);
  const seriesMetadata = parseSeriesMetadata(seriesPayload);
  const newestBySeries = new Map<string, LatestObservation>();

  for (const observation of observations) {
    const current = newestBySeries.get(observation.seriesId);
    if (
      !current ||
      new Date(observation.time ?? 0).getTime() >
        new Date(current.time ?? 0).getTime()
    ) {
      newestBySeries.set(observation.seriesId, observation);
    }
  }

  const byLocation = new Map<string, MapPoint>();
  for (const observation of newestBySeries.values()) {
    const location = locations.get(observation.stationId);
    const point =
      byLocation.get(observation.stationId) ??
      ({
        id: observation.stationId,
        stationSlug: getStationSlug(observation.stationId),
        name: publicStationName(observation.stationId, location?.name),
        siteType: location?.siteType ?? "Monitoring location",
        lat: location?.lat ?? observation.lat,
        lng: location?.lng ?? observation.lng,
        source: "USGS continuous",
        sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${observation.stationId}/`,
        lastUpdated: null,
        measurements: [],
      } satisfies MapPoint);
    const metric = metricByParameterCode.get(observation.parameterCode);
    if (!metric) continue;
    const metadata = seriesMetadata.get(observation.seriesId);
    const measurement: MapMeasurement = {
      key: metric,
      seriesId: observation.seriesId,
      parameterCode: observation.parameterCode,
      statisticId: observation.statisticId,
      value: observation.value,
      rawValue: observation.rawValue,
      unit: observation.unit,
      time: observation.time,
      approvalStatus: observation.approvalStatus,
      qualifiers: observation.qualifiers,
      freshness: measurementFreshness(observation.time, now),
      method: metadata?.method ?? null,
      depth: metadata?.depth ?? null,
      reviewState: "candidate",
    };
    point.measurements.push(measurement);
    if (
      !point.lastUpdated ||
      new Date(observation.time ?? 0).getTime() >
        new Date(point.lastUpdated).getTime()
    ) {
      point.lastUpdated = observation.time;
    }
    byLocation.set(observation.stationId, point);
  }

  return [...byLocation.values()]
    .map((point) => ({
      ...point,
      measurements: point.measurements.sort(
        (a, b) =>
          a.key.localeCompare(b.key) || a.seriesId.localeCompare(b.seriesId),
      ),
    }))
    .filter((point) =>
      point.measurements.some((measurement) => measurement.value !== null),
    )
    .sort(
      (a, b) =>
        new Date(b.lastUpdated ?? 0).getTime() -
        new Date(a.lastUpdated ?? 0).getTime(),
    );
}

function collectionUrl(collection: string, limit: number) {
  const url = new URL(`${USGS_COLLECTIONS_BASE}/${collection}/items`);
  const field =
    collection === "monitoring-locations" ? "id" : "monitoring_location_id";
  const stationList = mapStationAllowlist
    .map((stationId) => `'${stationId}'`)
    .join(",");
  url.searchParams.set("filter", `${field} IN (${stationList})`);
  url.searchParams.set("filter-lang", "cql2-text");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("f", "json");
  return url.toString();
}

async function fetchJsonWithRetry(
  url: string,
  apiKey: string | null,
  fetchImplementation: typeof fetch,
) {
  assertUsgsHost(url);
  const headers: HeadersInit = {
    Accept: "application/geo+json, application/json",
  };
  if (apiKey) headers["X-Api-Key"] = apiKey;

  const response = await fetchImplementation(url, {
    headers,
    signal: AbortSignal.timeout(5_000),
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`USGS request failed with status ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function fetchUsgsMapPoints(
  options: {
    apiKey?: string | null;
    fetchImplementation?: typeof fetch;
    now?: Date;
  } = {},
) {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const [latest, locations, series] = await Promise.all([
    fetchJsonWithRetry(
      collectionUrl("latest-continuous", 500),
      options.apiKey ?? null,
      fetchImplementation,
    ),
    fetchJsonWithRetry(
      collectionUrl("monitoring-locations", 250),
      options.apiKey ?? null,
      fetchImplementation,
    ),
    fetchJsonWithRetry(
      collectionUrl("time-series-metadata", 1_000),
      options.apiKey ?? null,
      fetchImplementation,
    ),
  ]);
  return buildUsgsMapPoints(latest, locations, series, { now: options.now });
}
