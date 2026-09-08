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
  coordinates: { lat: string; lng: string };
  type: string;
  description: string;
  sourceUrl: string;
  reviewDate: string;
  coverageStatus: "candidate" | "verified";
  metrics: Metric[];
};

export type MapMeasurement = {
  key: MetricKey;
  value: number | null;
  unit: string;
  time: string | null;
  approvalStatus?: string | null;
  qualifier?: string | null;
  freshness: "recent" | "older" | "archive" | "unavailable";
};

export type MapPoint = {
  id: string;
  name: string;
  siteType: string;
  lat: number;
  lng: number;
  source: "USGS continuous";
  sourceUrl: string;
  lastUpdated: string | null;
  measurements: MapMeasurement[];
};

// Captured from the official USGS latest-continuous endpoint on 2026-09-08.
// This is a resilient visual fallback only; the API route prefers a fresh query.
export const fallbackMapPoints: MapPoint[] = [
  {
    id: "USGS-11162765", name: "SF Bay a San Mateo Bridge NR Foster City CA", siteType: "Estuary monitoring location", lat: 37.5843787625333, lng: -122.250800469751, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11162765/", lastUpdated: "2026-09-08T09:45:00-07:00",
    measurements: [
      { key: "temperature", value: 20.6, unit: "°C", time: "2026-09-08T09:45:00-07:00", freshness: "older" },
      { key: "conductivity", value: 46400, unit: "µS/cm", time: "2026-09-08T09:45:00-07:00", freshness: "older" },
      { key: "turbidity", value: 32.1, unit: "FNU", time: "2026-09-08T09:45:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-11176900", name: "Alameda Creek near Niles CA", siteType: "Stream monitoring location", lat: 37.6265991482216, lng: -121.883012556168, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11176900/", lastUpdated: "2026-09-08T10:30:00-07:00",
    measurements: [
      { key: "temperature", value: 19.8, unit: "°C", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
      { key: "conductivity", value: 1360, unit: "µS/cm", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
      { key: "ph", value: 7.8, unit: "pH", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-11172175", name: "Coyote Creek near Edenvale CA", siteType: "Stream monitoring location", lat: 37.4221617182426, lng: -121.927457739056, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11172175/", lastUpdated: "2026-09-08T11:00:00-07:00",
    measurements: [
      { key: "temperature", value: 19.2, unit: "°C", time: "2026-09-08T11:00:00-07:00", freshness: "older" },
      { key: "turbidity", value: 19.3, unit: "FNU", time: "2026-09-08T11:00:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-11455780", name: "Napa River at Napa CA", siteType: "Stream monitoring location", lat: 38.0449205717485, lng: -122.126632259314, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11455780/", lastUpdated: "2026-09-08T10:00:00-07:00",
    measurements: [
      { key: "temperature", value: 20.4, unit: "°C", time: "2026-09-08T10:00:00-07:00", freshness: "older" },
      { key: "conductivity", value: 15500, unit: "µS/cm", time: "2026-09-08T10:00:00-07:00", freshness: "older" },
      { key: "turbidity", value: 25.4, unit: "FNU", time: "2026-09-08T10:00:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-11455820", name: "Napa River at Oak Knoll Ave CA", siteType: "Stream monitoring location", lat: 38.0613095355124, lng: -122.225524122464, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11455820/", lastUpdated: "2026-09-08T09:45:00-07:00",
    measurements: [
      { key: "temperature", value: 20.0, unit: "°C", time: "2026-09-08T09:45:00-07:00", freshness: "older" },
      { key: "conductivity", value: 25100, unit: "µS/cm", time: "2026-09-08T09:45:00-07:00", freshness: "older" },
      { key: "turbidity", value: 28.8, unit: "FNU", time: "2026-09-08T09:45:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-380807122034701", name: "Sonoma Creek at Sonoma CA", siteType: "Stream monitoring location", lat: 38.135189, lng: -122.063108, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-380807122034701/", lastUpdated: "2026-09-08T02:00:00-07:00",
    measurements: [
      { key: "temperature", value: 20.8, unit: "°C", time: "2026-09-08T02:00:00-07:00", freshness: "older" },
      { key: "dissolvedOxygen", value: 6.0, unit: "mg/L", time: "2026-09-08T02:00:00-07:00", freshness: "older" },
      { key: "ph", value: 7.4, unit: "pH", time: "2026-09-08T02:00:00-07:00", freshness: "older" },
      { key: "turbidity", value: 117, unit: "FNU", time: "2026-09-08T02:00:00-07:00", freshness: "older" },
      { key: "conductivity", value: 5320, unit: "µS/cm", time: "2026-09-08T02:00:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-381126121554801", name: "Suisun Creek near Fairfield CA", siteType: "Stream monitoring location", lat: 38.190131, lng: -121.930372, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-381126121554801/", lastUpdated: "2026-09-08T10:30:00-07:00",
    measurements: [
      { key: "temperature", value: 20.8, unit: "°C", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
      { key: "dissolvedOxygen", value: 7.2, unit: "mg/L", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
      { key: "ph", value: 7.3, unit: "pH", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
      { key: "turbidity", value: 25.4, unit: "FNU", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
      { key: "conductivity", value: 2520, unit: "µS/cm", time: "2026-09-08T10:30:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-381142122015801", name: "Green Valley Creek near Cordelia CA", siteType: "Stream monitoring location", lat: 38.1948944444444, lng: -122.032813888889, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-381142122015801/", lastUpdated: "2026-09-08T10:15:00-07:00",
    measurements: [
      { key: "temperature", value: 20.8, unit: "°C", time: "2026-09-08T10:15:00-07:00", freshness: "older" },
      { key: "dissolvedOxygen", value: 6.2, unit: "mg/L", time: "2026-09-08T10:15:00-07:00", freshness: "older" },
      { key: "ph", value: 7.4, unit: "pH", time: "2026-09-08T10:15:00-07:00", freshness: "older" },
      { key: "turbidity", value: 26.9, unit: "FNU", time: "2026-09-08T10:15:00-07:00", freshness: "older" },
      { key: "conductivity", value: 6190, unit: "µS/cm", time: "2026-09-08T10:15:00-07:00", freshness: "older" },
    ],
  },
  {
    id: "USGS-11162690", name: "San Francisco Bay at Point San Pablo CA", siteType: "Estuary monitoring location", lat: 37.8065953821159, lng: -122.457749608236, source: "USGS continuous", sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11162690/", lastUpdated: "2002-11-12T13:15:00-08:00",
    measurements: [
      { key: "temperature", value: 14.2, unit: "°C", time: "2002-11-12T13:15:00-08:00", freshness: "archive" },
      { key: "conductivity", value: 49100, unit: "µS/cm", time: "2002-11-12T13:15:00-08:00", freshness: "archive" },
    ],
  },
];

export const metricDefinitions: Record<MetricKey, { label: string; symbol: string; explanation: string }> = {
  temperature: { label: "Temperature", symbol: "°C", explanation: "Temperature influences oxygen availability and the pace of many ecological processes." },
  dissolvedOxygen: { label: "Dissolved oxygen", symbol: "DO", explanation: "Oxygen dissolved in water; keep concentration separate from percent saturation." },
  ph: { label: "pH", symbol: "pH", explanation: "A measure of acidity and alkalinity. pH has no concentration unit." },
  turbidity: { label: "Turbidity", symbol: "NTU / FNU", explanation: "A measure of cloudiness. Methods and units must stay visible rather than being casually merged." },
  conductivity: { label: "Conductivity", symbol: "µS/cm", explanation: "Electrical conductance can help describe dissolved ions, but it is not the same as salinity." },
};

export const stations: Station[] = [
  {
    slug: "san-mateo-bridge",
    providerId: "USGS-11162765",
    name: "SF Bay at the San Mateo Bridge",
    region: "Central / South Bay edge",
    coordinates: { lat: "37.5727° N", lng: "122.2542° W" },
    type: "Estuary monitoring location",
    description: "A promising launch candidate for a future verified series set. This preview keeps the station visible while its exact metric and depth mappings are reviewed.",
    sourceUrl: "https://waterdata.usgs.gov/monitoring-location/USGS-11162765/",
    reviewDate: "September 8, 2026",
    coverageStatus: "candidate",
    metrics: [
      { key: "temperature", label: "Temperature", symbol: "°C", unit: "Celsius", value: null, note: "Awaiting series verification" },
      { key: "dissolvedOxygen", label: "Dissolved oxygen", symbol: "DO", unit: "mg/L", value: null, note: "Awaiting series verification" },
      { key: "ph", label: "pH", symbol: "pH", unit: "pH scale", value: null, note: "Awaiting series verification" },
      { key: "turbidity", label: "Turbidity", symbol: "NTU / FNU", unit: "Method-specific", value: null, note: "No verified result in preview" },
    ],
  },
];

export function getStation(slug: string) {
  return stations.find((station) => station.slug === slug);
}

export function getStationSnapshot(station: Station) {
  return {
    station: station.slug,
    mode: "preview",
    asOf: null,
    measurements: station.metrics.map((metric) => ({
      metric: metric.key,
      value: metric.value,
      unit: metric.unit,
      state: "unavailable",
      note: metric.note,
    })),
  };
}
