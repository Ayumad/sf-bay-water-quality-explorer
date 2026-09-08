/**
 * Provider boundary for the future live integration.
 *
 * Keep USGS-specific fields here. The UI should receive internal records with
 * explicit units, collection precision, method, depth, and provenance.
 */
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
  metric: "temperature" | "dissolvedOxygen" | "ph" | "turbidity";
  rawValue: string;
  parsedValue: number | null;
  canonicalUnit: string | null;
  collectedAt: string | null;
  precision: "instant" | "date" | "unknown";
  qualifier?: string;
  provisional?: boolean;
  sourceUrl: string;
};

export function normalizeUsgsValue(input: string): number | null {
  const value = Number(input.trim());
  return Number.isFinite(value) ? value : null;
}

export function assertUsgsHost(url: string) {
  const parsed = new URL(url);
  if (parsed.hostname !== "api.waterdata.usgs.gov") {
    throw new Error("Upstream host is not on the USGS API allowlist");
  }
}
