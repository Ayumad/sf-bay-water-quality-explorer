"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CircleMarker, Map as LeafletMap, Marker, PathOptions, Polygon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapMeasurement, MapPoint, MetricKey } from "@/src/lib/data";
import { metricDefinitions } from "@/src/lib/data";

const metricOrder: MetricKey[] = ["temperature", "dissolvedOxygen", "ph", "turbidity", "conductivity"];

const metricColors: Record<MetricKey, string> = {
  temperature: "#f27663",
  dissolvedOxygen: "#4d8cf5",
  ph: "#9b73ed",
  turbidity: "#d99b32",
  conductivity: "#2aa88f",
};

type BayRegion = {
  id: string;
  label: string;
  labelPosition: [number, number];
  description: string;
  ecosystem: EcosystemKey;
  polygon: [number, number][];
};

type EcosystemKey = "open-bay" | "estuary" | "shallow-flats" | "tidal-marsh";
type MapView = "water-quality" | "ecosystems";

const ecosystems: Record<EcosystemKey, { label: string; icon: string; color: string; description: string }> = {
  "open-bay": { label: "Open bay", icon: "🌊", color: "#3689a8", description: "Wide water where currents, fish, and birds move through." },
  estuary: { label: "Estuary", icon: "🐦", color: "#8c72c9", description: "A meeting place where fresh water and salty water mix." },
  "shallow-flats": { label: "Shallow flats", icon: "🦀", color: "#d59a45", description: "Shallow, sunny water and mud where small creatures feed." },
  "tidal-marsh": { label: "Tidal marsh", icon: "🌾", color: "#4c9b78", description: "Tidal plants and creeks that give young fish places to hide." },
};

const majorCities = [
  { name: "San Francisco", position: [37.7749, -122.4194] as [number, number] },
  { name: "Oakland", position: [37.8044, -122.2711] as [number, number] },
  { name: "Berkeley", position: [37.8716, -122.2727] as [number, number] },
  { name: "Richmond", position: [37.9358, -122.3477] as [number, number] },
  { name: "San Jose", position: [37.3382, -121.8863] as [number, number] },
  { name: "Vallejo", position: [38.1041, -122.2566] as [number, number] },
];

const regions: BayRegion[] = [
  { id: "san-pablo", label: "San Pablo Bay", labelPosition: [38.13, -122.36], description: "Northern open water and the Richmond–San Rafael reach.", ecosystem: "open-bay", polygon: [[38.27, -122.52], [38.22, -122.42], [38.17, -122.30], [38.10, -122.18], [38.03, -122.17], [37.98, -122.27], [37.99, -122.38], [38.06, -122.49], [38.16, -122.55], [38.23, -122.55]] },
  { id: "suisun", label: "Suisun Bay & Delta edge", labelPosition: [38.11, -121.96], description: "The eastern transition where bay water meets the Sacramento–San Joaquin Delta.", ecosystem: "estuary", polygon: [[38.17, -122.13], [38.26, -121.98], [38.24, -121.80], [38.14, -121.72], [38.04, -121.79], [37.97, -121.91], [37.98, -122.05], [38.05, -122.12]] },
  { id: "central-bay", label: "Central Bay", labelPosition: [37.86, -122.35], description: "The Golden Gate, the Bay Bridge corridor, and the central basin.", ecosystem: "open-bay", polygon: [[37.99, -122.40], [37.94, -122.34], [37.88, -122.28], [37.82, -122.23], [37.76, -122.25], [37.71, -122.31], [37.74, -122.39], [37.81, -122.45], [37.90, -122.45], [37.96, -122.44]] },
  { id: "south-bay", label: "South Bay", labelPosition: [37.56, -122.27], description: "The broad southern basin from San Mateo toward the Dumbarton reach.", ecosystem: "shallow-flats", polygon: [[37.70, -122.30], [37.71, -122.21], [37.65, -122.15], [37.57, -122.13], [37.48, -122.17], [37.41, -122.27], [37.40, -122.36], [37.48, -122.41], [37.58, -122.40], [37.66, -122.36]] },
  { id: "alviso", label: "Alviso & South Bay tributaries", labelPosition: [37.46, -122.03], description: "The shallow southern edge and connected tributary corridors.", ecosystem: "tidal-marsh", polygon: [[37.56, -122.11], [37.63, -122.05], [37.60, -121.97], [37.52, -121.93], [37.43, -121.85], [37.35, -121.87], [37.31, -122.00], [37.35, -122.13], [37.43, -122.18], [37.51, -122.16]] },
];

function getMeasurement(point: MapPoint, key: MetricKey): MapMeasurement | undefined {
  return point.measurements.find((measurement) => measurement.key === key);
}

function formatValue(measurement: MapMeasurement | undefined) {
  if (!measurement || measurement.value === null) return "—";
  return `${measurement.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${measurement.unit}`;
}

function formatAge(time: string | null) {
  if (!time) return "No timestamp";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(time));
}

function pointInPolygon(lat: number, lng: number, polygon: [number, number][]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [currentLat, currentLng] = polygon[index];
    const [previousLat, previousLng] = polygon[previous];
    const crossesLatitude = (currentLat > lat) !== (previousLat > lat);
    const longitudeAtLatitude = ((previousLng - currentLng) * (lat - currentLat)) / (previousLat - currentLat) + currentLng;
    if (crossesLatitude && lng < longitudeAtLatitude) inside = !inside;
  }
  return inside;
}

function getFreshnessLabel(freshness: MapMeasurement["freshness"] | undefined) {
  if (freshness === "recent") return "Recent source value";
  if (freshness === "older") return "Older source value";
  if (freshness === "archive") return "Archive value";
  return "No value for this metric";
}

function regionForPoint(point: MapPoint) {
  const polygonRegion = regions.find((region) => pointInPolygon(point.lat, point.lng, region.polygon));
  if (polygonRegion) return polygonRegion.id;
  if (point.lat >= 38.02 && point.lng < -122.18) return "san-pablo";
  if (point.lat >= 37.95) return "suisun";
  if (point.lat >= 37.75) return "central-bay";
  if (point.lng > -122.1) return "alviso";
  return "south-bay";
}

function ecosystemForRegionId(regionId: string): EcosystemKey {
  return regions.find((region) => region.id === regionId)?.ecosystem ?? "open-bay";
}

function regionSummary(region: BayRegion, points: MapPoint[], metric: MetricKey) {
  const regionalPoints = points.filter((point) => regionForPoint(point) === region.id);
  const measurements = regionalPoints.map((point) => getMeasurement(point, metric)).filter((measurement): measurement is MapMeasurement => Boolean(measurement && measurement.value !== null));
  const values = measurements.map((measurement) => measurement.value as number).sort((a, b) => a - b);
  const latest = [...measurements].sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime())[0];
  return {
    region,
    points: regionalPoints,
    measurements,
    coverage: measurements.length,
    valueSpan: values.length > 1 ? `${values[0].toLocaleString(undefined, { maximumFractionDigits: 2 })}–${values.at(-1)?.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${measurements[0]?.unit ?? ""}` : values.length === 1 ? formatValue(measurements[0]) : "No value in this region",
    latest,
  };
}

type LeafletApi = typeof import("leaflet");

function regionPolygonStyle(region: BayRegion, metric: MetricKey, selected: boolean, view: MapView): PathOptions {
  const color = view === "ecosystems" ? ecosystems[region.ecosystem].color : metricColors[metric];
  return {
    color,
    weight: selected ? 3 : 1.5,
    fillColor: color,
    fillOpacity: view === "ecosystems" ? (selected ? 0.22 : 0.1) : 0,
    opacity: selected ? 0.95 : 0.62,
  };
}

export function BayMap() {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletApi | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const cityLabelsRef = useRef<Marker[]>([]);
  const regionLabelsRef = useRef<Marker[]>([]);
  const regionLayersRef = useRef<Record<string, Polygon>>({});
  const pointLayersRef = useRef<Record<string, CircleMarker>>({});
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [metric, setMetric] = useState<MetricKey>("temperature");
  const [view, setView] = useState<MapView>("water-quality");
  const [selectedRegionId, setSelectedRegionId] = useState("central-bay");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return;
    let cancelled = false;
    void import("leaflet").then((module) => {
      if (cancelled || !mapHostRef.current || mapRef.current) return;
      const L = module.default;
      const map = L.map(mapHostRef.current, { zoomControl: true, scrollWheelZoom: true, minZoom: 9, maxZoom: 15 });
      map.setView([37.76, -122.28], 10);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri — Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, and the GIS User Community",
      }).addTo(map);
      map.fitBounds([[37.30, -122.58], [38.28, -121.70]], { padding: [22, 22] });
      cityLabelsRef.current = majorCities.map((city) => L.marker(city.position, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "city-label",
          html: `<span><i aria-hidden="true"></i>${city.name}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        zIndexOffset: 500,
      }).addTo(map));
      regionLabelsRef.current = regions.map((region) => L.marker(region.labelPosition, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "water-region-label",
          html: `<span><i aria-hidden="true">${ecosystems[region.ecosystem].icon}</i>${region.label}</span>`,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        zIndexOffset: 450,
      }).addTo(map));
      leafletRef.current = L;
      mapRef.current = map;
      setMapReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    });
    return () => {
      cancelled = true;
      Object.values(regionLayersRef.current).forEach((layer) => layer.remove());
      Object.values(pointLayersRef.current).forEach((layer) => layer.remove());
      cityLabelsRef.current.forEach((layer) => layer.remove());
      regionLabelsRef.current.forEach((layer) => layer.remove());
      cityLabelsRef.current = [];
      regionLabelsRef.current = [];
      regionLayersRef.current = {};
      pointLayersRef.current = {};
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/map-points", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error("The live station feed is unavailable");
        return response.json() as Promise<{ points: MapPoint[]; degraded?: boolean; error?: string }>;
      })
      .then((payload) => {
        if (!active) return;
        setPoints(payload.points);
        if (payload.points.some((point) => regionForPoint(point) === "central-bay")) setSelectedRegionId("central-bay");
        else if (payload.points[0]) setSelectedRegionId(regionForPoint(payload.points[0]));
        if (payload.degraded) setError(payload.error ?? "Showing a dated source snapshot while the live feed recovers.");
      })
      .catch(() => {
        if (active) setError("The station feed could not be reached. Try again shortly; the map will not invent a value.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? regions[0];
  const summaries = useMemo(() => regions.map((region) => regionSummary(region, points, metric)), [points, metric]);
  const selectedSummary = summaries.find((summary) => summary.region.id === selectedRegion.id) ?? summaries[0];
  const selectedEcosystem = selectedSummary ? ecosystems[selectedSummary.region.ecosystem] : ecosystems["open-bay"];

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;
    regions.forEach((region) => {
      let layer = regionLayersRef.current[region.id];
      if (!layer) {
        layer = L.polygon(region.polygon, regionPolygonStyle(region, metric, region.id === selectedRegion.id, view)).addTo(map);
        layer.bindTooltip(`<strong>${region.label}</strong><br>${region.description}`, { sticky: true, direction: "top" });
        layer.on("mouseover click", () => setSelectedRegionId(region.id));
        regionLayersRef.current[region.id] = layer;
      } else {
        layer.setStyle(regionPolygonStyle(region, metric, region.id === selectedRegion.id, view));
      }
    });
    points.forEach((point) => {
      let layer = pointLayersRef.current[point.id];
      const regionId = regionForPoint(point);
      if (!layer) {
        const pointColor = view === "ecosystems" ? ecosystems[ecosystemForRegionId(regionForPoint(point))].color : metricColors[metric];
        layer = L.circleMarker([point.lat, point.lng], { radius: 5, color: "#fff", weight: 1.5, fillColor: pointColor, fillOpacity: 0.95 }).addTo(map);
        layer.bindTooltip(point.name, { direction: "top", offset: [0, -4] });
        layer.on("mouseover click", () => setSelectedRegionId(regionId));
        pointLayersRef.current[point.id] = layer;
      } else {
        const pointColor = view === "ecosystems" ? ecosystems[ecosystemForRegionId(regionId)].color : metricColors[metric];
        layer.setStyle({ fillColor: pointColor, color: regionId === selectedRegion.id ? "#fff" : "rgba(255,255,255,.65)", radius: regionId === selectedRegion.id ? 6 : 5 });
      }
    });
  }, [mapReady, metric, points, selectedRegion.id, view]);

  return (
    <section className="map-shell" aria-labelledby="bay-map-heading">
      <div className="map-toolbar">
        <div>
          <p className="section-kicker">Live source view · big map, simple choices</p>
          <h2 id="bay-map-heading">The Bay, body of water by body of water</h2>
        </div>
        <div className="map-feed-status" aria-live="polite">
          <span className={`status-dot${loading ? " loading" : ""}`} />
          {loading ? "Loading station feed" : error ? "Source degraded" : `${points.length} source points in ${regions.length} regions`}
        </div>
      </div>

      <div className="map-view-switcher" role="group" aria-label="Choose how to explore the map">
        <span className="metric-switcher-label">Explore by</span>
        <button type="button" className={`map-view-chip${view === "water-quality" ? " selected" : ""}`} aria-pressed={view === "water-quality"} onClick={() => setView("water-quality")}>
          <span aria-hidden="true">💧</span> Water quality
        </button>
        <button type="button" className={`map-view-chip${view === "ecosystems" ? " selected" : ""}`} aria-pressed={view === "ecosystems"} onClick={() => setView("ecosystems")}>
          <span aria-hidden="true">🦋</span> Habitats
        </button>
      </div>

      {view === "water-quality" && <div className="metric-switcher" role="group" aria-label="Choose a map metric">
        <span className="metric-switcher-label">Color by</span>
        {metricOrder.map((key) => (
          <button type="button" key={key} className={`metric-chip${metric === key ? " selected" : ""}`} style={{ "--metric-color": metricColors[key] } as CSSProperties} aria-pressed={metric === key} onClick={() => setMetric(key)}>
            <span className="metric-chip-dot" aria-hidden="true" />{metricDefinitions[key].label}
          </button>
        ))}
      </div>}

      <div className="region-switcher" role="group" aria-label="Choose a Bay region">
        {summaries.map((summary) => (
          <button type="button" key={summary.region.id} className={`region-chip${summary.region.id === selectedRegion.id ? " selected" : ""}`} style={{ "--region-color": view === "ecosystems" ? ecosystems[summary.region.ecosystem].color : metricColors[metric] } as CSSProperties} aria-pressed={summary.region.id === selectedRegion.id} onClick={() => setSelectedRegionId(summary.region.id)}>
            <span className="region-chip-icon" aria-hidden="true">{ecosystems[summary.region.ecosystem].icon}</span><span className="region-chip-count">{summary.points.length}</span>{summary.region.label}
          </button>
        ))}
      </div>

      <div className="map-layout">
        <div className="bay-map-canvas" role="region" aria-label="Navigable simplified map of San Francisco Bay with selectable water regions and major city labels">
          <div className="leaflet-map-canvas" ref={mapHostRef} />
          {error && <div className="map-overlay-message" role="status">{error}</div>}
          <div className="map-scale-note">Drag to pan · hover a colorful region · tap a button to learn</div>
        </div>

        <aside className="map-detail region-detail" aria-live="polite" aria-label="Selected Bay region details">
          {selectedSummary ? (
            <>
              <div className="map-detail-kicker"><span className="ecosystem-icon" aria-hidden="true">{selectedEcosystem.icon}</span> {view === "ecosystems" ? "Habitat view" : `${metricDefinitions[metric].label} lens`}</div>
              <h3>{selectedSummary.region.label}</h3>
              <p className="map-detail-type"><strong>{selectedEcosystem.label}</strong> · {selectedEcosystem.description}</p>
              <p className="map-detail-region-note">{selectedSummary.region.description}</p>
              <div className="region-detail-stat"><strong>{view === "ecosystems" ? selectedSummary.points.length : selectedSummary.coverage}</strong><span>{view === "ecosystems" ? "source points in this region" : "source points with a value for this metric"}</span></div>
              <div className="map-detail-band">Observed span: {selectedSummary.valueSpan}<br />Freshest source: {formatAge(selectedSummary.latest?.time ?? null)}</div>
              <div className="region-point-list">
                {selectedSummary.points.length === 0 && <p className="region-empty">No source points are currently mapped to this region.</p>}
                {selectedSummary.points.map((point) => {
                  const measurement = getMeasurement(point, metric);
                  return <div className="region-point-row" key={point.id}><span><strong>{point.name}</strong><small>{point.id}</small></span><b style={{ color: metricColors[metric] }}>{formatValue(measurement)}</b></div>;
                })}
              </div>
              <p className="region-context-note">The habitat layer is a friendly learning guide, not a species count. Water-quality values stay tied to their source points, without averaging unlike sensors or depths.</p>
            </>
          ) : <div className="map-detail-empty"><span className="empty-state-icon" aria-hidden="true">◎</span><h3>Choose a region</h3><p>Hover, click, or tab through the region buttons to inspect the wider Bay area.</p></div>}
        </aside>
      </div>

      <div className="map-legend">
        {view === "ecosystems" ? <>
          <div><strong>Habitat color key</strong><span>Each color is a different kind of Bay home for plants and animals.</span></div>
          {Object.values(ecosystems).map((ecosystem) => <div className="legend-band" key={ecosystem.label}><span className="legend-emoji" aria-hidden="true">{ecosystem.icon}</span> {ecosystem.label}</div>)}
          <div className="legend-note">A big picture for learning: it does not say which species are present today.</div>
        </> : <>
          <div><strong>Water quality color key</strong><span>Each hue identifies the selected measurement type; exact values stay in the detail rail.</span></div>
          <div className="legend-band"><span className="legend-swatch low" /> lower observed value</div>
          <div className="legend-band"><span className="legend-swatch mid" /> mid observed value</div>
          <div className="legend-band"><span className="legend-swatch high" /> higher observed value</div>
          <div className="legend-note">Region spans are visualization aids, not regulatory thresholds or an AQI-style safety score.</div>
        </>}
      </div>
    </section>
  );
}
