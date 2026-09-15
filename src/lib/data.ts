export type MetricKey = "temperature" | "dissolvedOxygen" | "ph" | "turbidity" | "conductivity";

export type Metric = {
  key: MetricKey;
  label: string;
  symbol: string;
  unit: string;
  value: string | null;
  note: string;
};

export type Station = {
  slug: string;
  providerId: string;
  name: string;
  region: string;
  coordinates: { lat: number; lng: number };
  type: string;
  description: string;
  sourceUrl: string;
  reviewDate: string;
  coverageStatus: "candidate" | "verified";
  metrics: Metric[];
  seriesCandidates: SeriesCandidate[];
};

export type SeriesCandidate = {
  seriesId: string;
  metric: MetricKey;
  parameterCode: string;
  depth: string;
  state: "candidate" | "verified";
  note: string;
};

export type MeasurementFreshness = "recent" | "older" | "archive" | "unavailable";
export type MeasurementReviewState = "candidate" | "verified" | "captured-snapshot";

export type MapMeasurement = {
  key: MetricKey;
  seriesId: string;
  parameterCode: string;
  statisticId: string | null;
  value: number | null;
  rawValue: string | null;
  unit: string;
  time: string | null;
  approvalStatus: string | null;
  qualifiers: string[];
  freshness: MeasurementFreshness;
  method: string | null;
  depth: string | null;
  reviewState: MeasurementReviewState;
};

export type MapPoint = {
  id: string;
  stationSlug: string | null;
  name: string;
  siteType: string;
  lat: number;
  lng: number;
  source: "USGS continuous";
  sourceUrl: string;
  lastUpdated: string | null;
  measurements: MapMeasurement[];
};

export type MapFeedMode = "captured-snapshot" | "live-preview" | "published";

export type MapFeed = {
  mode: MapFeedMode;
  source: string;
  fetchedAt: string;
  capturedAt: string | null;
  degraded: boolean;
  notice: string;
  points: MapPoint[];
};

export const metricDefinitions: Record<MetricKey, {
  label: string;
  symbol: string;
  parameterCode: string;
  explanation: string;
  colors: readonly [string, string, string];
}> = {
  temperature: {
    label: "Temperature",
    symbol: "°C",
    parameterCode: "00010",
    explanation: "Temperature influences oxygen availability and the pace of many ecological processes.",
    colors: ["#ffd5cd", "#f27663", "#9f3d31"],
  },
  dissolvedOxygen: {
    label: "Dissolved oxygen",
    symbol: "DO",
    parameterCode: "00300",
    explanation: "Oxygen dissolved in water; concentration stays separate from percent saturation.",
    colors: ["#d8e6ff", "#4d8cf5", "#234d9d"],
  },
  ph: {
    label: "pH",
    symbol: "pH",
    parameterCode: "00400",
    explanation: "A measure of acidity and alkalinity. pH has no concentration unit.",
    colors: ["#e6dcfb", "#9b73ed", "#5b349f"],
  },
  turbidity: {
    label: "Turbidity",
    symbol: "NTU / FNU",
    parameterCode: "63680",
    explanation: "A measure of cloudiness. Methods and units stay visible rather than being casually merged.",
    colors: ["#f8e7c5", "#d99b32", "#855b14"],
  },
  conductivity: {
    label: "Conductivity",
    symbol: "µS/cm",
    parameterCode: "00095",
    explanation: "Electrical conductance can help describe dissolved ions, but it is not the same as salinity.",
    colors: ["#cef0e8", "#2aa88f", "#176555"],
  },
};

export const metricKeys = Object.keys(metricDefinitions) as MetricKey[];
export const metricByParameterCode = new Map(
  metricKeys.map((key) => [metricDefinitions[key].parameterCode, key]),
);

export const stations: Station[] = [
  {
    slug: "san-mateo-bridge",
    providerId: "USGS-11162765",
    name: "SF Bay at the San Mateo Bridge",
    region: "Central / South Bay edge",
    coordinates: { lat: 37.5843787625333, lng: -122.250800469751 },
    type: "Estuary monitoring location",
    description: "A promising launch candidate whose upper- and lower-depth sensors must remain distinct while their publication mappings are reviewed.",
    sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11162765/",
    reviewDate: "September 15, 2026",
    coverageStatus: "candidate",
    metrics: [
      { key: "temperature", label: "Temperature", symbol: "°C", unit: "Celsius", value: null, note: "Awaiting depth-specific series approval" },
      { key: "dissolvedOxygen", label: "Dissolved oxygen", symbol: "DO", unit: "mg/L", value: null, note: "Latest source series is currently unavailable" },
      { key: "ph", label: "pH", symbol: "pH", unit: "pH scale", value: null, note: "No verified continuous series" },
      { key: "turbidity", label: "Turbidity", symbol: "NTU / FNU", unit: "Method-specific", value: null, note: "Awaiting depth-specific series approval" },
      { key: "conductivity", label: "Conductivity", symbol: "µS/cm", unit: "Source unit", value: null, note: "Awaiting depth-specific series approval" },
    ],
    seriesCandidates: [
      { seriesId: "9d24212eeac749f8affc5e712244d33a", metric: "temperature", parameterCode: "00010", depth: "Upper · 44 ft from bed", state: "candidate", note: "Instantaneous source series" },
      { seriesId: "eb1e13d3c23e4e32b7a4c15055c585b8", metric: "temperature", parameterCode: "00010", depth: "Lower · 10 ft from bed", state: "candidate", note: "Instantaneous source series" },
      { seriesId: "48740725bb4c4042976f9ff7f95f8a21", metric: "dissolvedOxygen", parameterCode: "00300", depth: "Lower · 10 ft from bed", state: "candidate", note: "Latest source result is unavailable" },
      { seriesId: "4c94f2837f9a42a4b90fc9c6d0fdf391", metric: "turbidity", parameterCode: "63680", depth: "Upper · 44 ft from bed", state: "candidate", note: "YSI EXO instantaneous series" },
      { seriesId: "81d0552075e8496e8465d2595fa7c8f6", metric: "turbidity", parameterCode: "63680", depth: "Lower · 10 ft from bed", state: "candidate", note: "YSI EXO instantaneous series" },
      { seriesId: "4e07dbc52da44804bb25ceaf74ab4786", metric: "conductivity", parameterCode: "00095", depth: "Upper · 44 ft from bed", state: "candidate", note: "Instantaneous source series" },
      { seriesId: "806f41b9f9ff49b4bbb03f8daa84dd84", metric: "conductivity", parameterCode: "00095", depth: "Lower · 10 ft from bed", state: "candidate", note: "Instantaneous source series" },
    ],
  },
];

export const mapStationAllowlist = [
  "USGS-11162765",
  "USGS-11176900",
  "USGS-11172175",
  "USGS-11455780",
  "USGS-11455820",
  "USGS-380807122034701",
  "USGS-381126121554801",
  "USGS-381142122015801",
  "USGS-11162690",
] as const;

const stationSlugByProviderId = new Map(stations.map((station) => [station.providerId, station.slug]));

export function getStation(slug: string) {
  return stations.find((station) => station.slug === slug);
}

export function getStationSlug(providerId: string) {
  return stationSlugByProviderId.get(providerId) ?? null;
}

export function getStationSnapshot(station: Station) {
  return {
    station: station.slug,
    mode: "preview" as const,
    asOf: null,
    measurements: station.metrics.map((metric) => ({
      metric: metric.key,
      value: metric.value,
      unit: metric.unit,
      state: "unavailable" as const,
      note: metric.note,
    })),
  };
}

const SNAPSHOT_CAPTURED_AT = "2026-09-08T18:00:00.000Z";

function capturedMeasurement(
  stationId: string,
  key: MetricKey,
  value: number,
  unit: string,
  time: string,
): MapMeasurement {
  return {
    key,
    seriesId: `captured:${stationId}:${key}`,
    parameterCode: metricDefinitions[key].parameterCode,
    statisticId: null,
    value,
    rawValue: String(value),
    unit,
    time,
    approvalStatus: null,
    qualifiers: [],
    freshness: time < "2026-01-01" ? "archive" : "older",
    method: null,
    depth: "Series metadata was not retained in this early snapshot",
    reviewState: "captured-snapshot",
  };
}

function capturedPoint(input: Omit<MapPoint, "stationSlug" | "source" | "sourceUrl" | "measurements"> & {
  measurements: Array<[MetricKey, number, string, string]>;
}): MapPoint {
  return {
    ...input,
    stationSlug: getStationSlug(input.id),
    source: "USGS continuous",
    sourceUrl: `https://waterdata.usgs.gov/monitoring-location/${input.id}/`,
    measurements: input.measurements.map(([key, value, unit, time]) => capturedMeasurement(input.id, key, value, unit, time)),
  };
}

// Captured from the official USGS latest-continuous endpoint on 2026-09-08.
// These values are a resilience fixture and are never presented as current conditions.
export const fallbackMapPoints: MapPoint[] = [
  capturedPoint({ id: "USGS-11162765", name: "SF Bay a San Mateo Bridge NR Foster City CA", siteType: "Estuary monitoring location", lat: 37.5843787625333, lng: -122.250800469751, lastUpdated: "2026-09-08T09:45:00-07:00", measurements: [["temperature", 20.6, "°C", "2026-09-08T09:45:00-07:00"], ["conductivity", 46400, "µS/cm", "2026-09-08T09:45:00-07:00"], ["turbidity", 32.1, "FNU", "2026-09-08T09:45:00-07:00"]] }),
  capturedPoint({ id: "USGS-11176900", name: "Alameda Creek near Niles CA", siteType: "Stream monitoring location", lat: 37.6265991482216, lng: -121.883012556168, lastUpdated: "2026-09-08T10:30:00-07:00", measurements: [["temperature", 19.8, "°C", "2026-09-08T10:30:00-07:00"], ["conductivity", 1360, "µS/cm", "2026-09-08T10:30:00-07:00"], ["ph", 7.8, "pH", "2026-09-08T10:30:00-07:00"]] }),
  capturedPoint({ id: "USGS-11172175", name: "Coyote Creek near Edenvale CA", siteType: "Stream monitoring location", lat: 37.4221617182426, lng: -121.927457739056, lastUpdated: "2026-09-08T11:00:00-07:00", measurements: [["temperature", 19.2, "°C", "2026-09-08T11:00:00-07:00"], ["turbidity", 19.3, "FNU", "2026-09-08T11:00:00-07:00"]] }),
  capturedPoint({ id: "USGS-11455780", name: "Napa River at Napa CA", siteType: "Stream monitoring location", lat: 38.0449205717485, lng: -122.126632259314, lastUpdated: "2026-09-08T10:00:00-07:00", measurements: [["temperature", 20.4, "°C", "2026-09-08T10:00:00-07:00"], ["conductivity", 15500, "µS/cm", "2026-09-08T10:00:00-07:00"], ["turbidity", 25.4, "FNU", "2026-09-08T10:00:00-07:00"]] }),
  capturedPoint({ id: "USGS-11455820", name: "Napa River at Oak Knoll Ave CA", siteType: "Stream monitoring location", lat: 38.0613095355124, lng: -122.225524122464, lastUpdated: "2026-09-08T09:45:00-07:00", measurements: [["temperature", 20, "°C", "2026-09-08T09:45:00-07:00"], ["conductivity", 25100, "µS/cm", "2026-09-08T09:45:00-07:00"], ["turbidity", 28.8, "FNU", "2026-09-08T09:45:00-07:00"]] }),
  capturedPoint({ id: "USGS-380807122034701", name: "Sonoma Creek at Sonoma CA", siteType: "Stream monitoring location", lat: 38.135189, lng: -122.063108, lastUpdated: "2026-09-08T02:00:00-07:00", measurements: [["temperature", 20.8, "°C", "2026-09-08T02:00:00-07:00"], ["dissolvedOxygen", 6, "mg/L", "2026-09-08T02:00:00-07:00"], ["ph", 7.4, "pH", "2026-09-08T02:00:00-07:00"], ["turbidity", 117, "FNU", "2026-09-08T02:00:00-07:00"], ["conductivity", 5320, "µS/cm", "2026-09-08T02:00:00-07:00"]] }),
  capturedPoint({ id: "USGS-381126121554801", name: "Suisun Creek near Fairfield CA", siteType: "Stream monitoring location", lat: 38.190131, lng: -121.930372, lastUpdated: "2026-09-08T10:30:00-07:00", measurements: [["temperature", 20.8, "°C", "2026-09-08T10:30:00-07:00"], ["dissolvedOxygen", 7.2, "mg/L", "2026-09-08T10:30:00-07:00"], ["ph", 7.3, "pH", "2026-09-08T10:30:00-07:00"], ["turbidity", 25.4, "FNU", "2026-09-08T10:30:00-07:00"], ["conductivity", 2520, "µS/cm", "2026-09-08T10:30:00-07:00"]] }),
  capturedPoint({ id: "USGS-381142122015801", name: "Green Valley Creek near Cordelia CA", siteType: "Stream monitoring location", lat: 38.1948944444444, lng: -122.032813888889, lastUpdated: "2026-09-08T10:15:00-07:00", measurements: [["temperature", 20.8, "°C", "2026-09-08T10:15:00-07:00"], ["dissolvedOxygen", 6.2, "mg/L", "2026-09-08T10:15:00-07:00"], ["ph", 7.4, "pH", "2026-09-08T10:15:00-07:00"], ["turbidity", 26.9, "FNU", "2026-09-08T10:15:00-07:00"], ["conductivity", 6190, "µS/cm", "2026-09-08T10:15:00-07:00"]] }),
  capturedPoint({ id: "USGS-11162690", name: "San Francisco Bay at Point San Pablo CA", siteType: "Estuary monitoring location", lat: 37.8065953821159, lng: -122.457749608236, lastUpdated: "2002-11-12T13:15:00-08:00", measurements: [["temperature", 14.2, "°C", "2002-11-12T13:15:00-08:00"], ["conductivity", 49100, "µS/cm", "2002-11-12T13:15:00-08:00"]] }),
];

export function capturedMapFeed(now = new Date()): MapFeed {
  return {
    mode: "captured-snapshot",
    source: "USGS captured fallback snapshot",
    fetchedAt: now.toISOString(),
    capturedAt: SNAPSHOT_CAPTURED_AT,
    degraded: false,
    notice: "Showing a dated source snapshot. It is useful for exploring the interface, not for current-condition claims.",
    points: fallbackMapPoints,
  };
}
