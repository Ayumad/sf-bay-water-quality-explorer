"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CircleMarker, Map as LeafletMap, Marker, PathOptions, Polygon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { metricDefinitions, metricKeys } from "@/src/lib/data";
import type { MapFeed, MapPoint, MetricKey } from "@/src/lib/data";
import {
  escapeHtml,
  formatValue,
  freshnessLabel,
  getMeasurements,
  getSeries,
  metricExtent,
  metricValueColor,
  regionSummary,
  selectDisplayMeasurement,
} from "@/src/lib/map-utils";
import {
  ecosystemForRegionId,
  ecosystems,
  majorCities,
  regionForPoint,
  regions,
} from "@/src/lib/regions";
import type { BayRegion } from "@/src/lib/regions";

type MapView = "water-quality" | "ecosystems";
type LeafletApi = typeof import("leaflet");

function formatTimestamp(time: string | null) {
  if (!time) return "No collection timestamp";
  const parsed = new Date(time);
  if (!Number.isFinite(parsed.getTime())) return "Invalid source timestamp";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(parsed);
}

function regionPolygonStyle(region: BayRegion, metric: MetricKey, selected: boolean, view: MapView): PathOptions {
  const color = view === "ecosystems" ? ecosystems[region.ecosystem].color : metricDefinitions[metric].colors[1];
  return {
    color,
    weight: selected ? 3 : 1.5,
    fillColor: color,
    fillOpacity: view === "ecosystems" ? (selected ? 0.22 : 0.1) : (selected ? 0.08 : 0.025),
    opacity: selected ? 0.95 : 0.62,
  };
}

function feedStatus(feed: MapFeed | null, loading: boolean) {
  if (loading) return "Loading station feed";
  if (!feed) return "Station feed unavailable";
  if (feed.degraded) return "Live source degraded · dated snapshot";
  if (feed.mode === "live-preview") return `${feed.points.length} live-preview source points`;
  if (feed.mode === "published") return `${feed.points.length} verified source points`;
  return `${feed.points.length} dated-snapshot source points`;
}

function SeriesReading({ point, metric }: { point: MapPoint; metric: MetricKey }) {
  const measurements = getSeries(point, metric);
  if (!measurements.length) return <p className="series-empty">No series for this metric at this source point.</p>;

  return (
    <div className="series-list">
      {measurements.map((measurement) => (
        <div className="series-row" key={measurement.seriesId}>
          <div className="series-value-line">
            <strong>{formatValue(measurement)}</strong>
            <span className={`freshness-tag ${measurement.freshness}`}>{freshnessLabel(measurement.freshness)}</span>
          </div>
          <time dateTime={measurement.time ?? undefined}>{formatTimestamp(measurement.time)}</time>
          <span>{measurement.depth ?? "Depth not supplied"}{measurement.method ? ` · ${measurement.method}` : ""}</span>
          <span>Series {measurement.seriesId} · parameter {measurement.parameterCode}{measurement.statisticId ? ` · statistic ${measurement.statisticId}` : ""}</span>
          <span>{measurement.approvalStatus ?? "Approval status not supplied"}{measurement.qualifiers.length ? ` · ${measurement.qualifiers.join(", ")}` : ""}</span>
        </div>
      ))}
    </div>
  );
}

export function BayMap() {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletApi | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const cityLabelsRef = useRef<Marker[]>([]);
  const regionLabelsRef = useRef<Marker[]>([]);
  const regionLayersRef = useRef<Record<string, Polygon>>({});
  const pointLayersRef = useRef<Record<string, CircleMarker>>({});
  const [feed, setFeed] = useState<MapFeed | null>(null);
  const [metric, setMetric] = useState<MetricKey>("temperature");
  const [view, setView] = useState<MapView>("water-quality");
  const [selectedRegionId, setSelectedRegionId] = useState("central-bay");
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSequence, setRequestSequence] = useState(0);
  const [mapReady, setMapReady] = useState(false);

  const points = useMemo(() => feed?.points ?? [], [feed]);
  const extent = useMemo(() => metricExtent(points, metric), [points, metric]);
  const summaries = useMemo(() => regions.map((region) => regionSummary(region, points, metric)), [points, metric]);
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? regions[0];
  const selectedSummary = summaries.find((summary) => summary.region.id === selectedRegion.id) ?? summaries[0];
  const selectedEcosystem = selectedSummary ? ecosystems[selectedSummary.region.ecosystem] : ecosystems["open-bay"];
  const scaleColors = metricDefinitions[metric].colors;

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
        attribution: "Tiles &copy; Esri and the GIS User Community",
      }).addTo(map);
      map.fitBounds([[37.30, -122.58], [38.28, -121.70]], { padding: [22, 22] });
      cityLabelsRef.current = majorCities.map((city) => L.marker(city.position, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: "city-label", html: `<span><i aria-hidden="true"></i>${city.name}</span>`, iconSize: [0, 0], iconAnchor: [0, 0] }),
        zIndexOffset: 500,
      }).addTo(map));
      regionLabelsRef.current = regions.map((region) => L.marker(region.labelPosition, {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({ className: "water-region-label", html: `<span><i aria-hidden="true">${ecosystems[region.ecosystem].icon}</i>${region.label}</span>`, iconSize: [0, 0], iconAnchor: [0, 0] }),
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
    const controller = new AbortController();
    let active = true;
    const endpoint = `/api/map-points?v=2${requestSequence ? `&retry=${requestSequence}` : ""}`;
    fetch(endpoint, { headers: { Accept: "application/json" }, signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("The station feed is unavailable");
        return response.json() as Promise<MapFeed>;
      })
      .then((payload) => {
        if (!active) return;
        setFeed(payload);
        if (payload.points.some((point) => regionForPoint(point) === "central-bay")) setSelectedRegionId("central-bay");
        else if (payload.points[0]) setSelectedRegionId(regionForPoint(payload.points[0]));
      })
      .catch((error: unknown) => {
        if (!active || (error instanceof DOMException && error.name === "AbortError")) return;
        setRequestError("The station feed could not be reached. The map will not invent a value.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => {
      active = false;
      controller.abort();
    };
  }, [requestSequence]);

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

    const activePointIds = new Set(points.map((point) => point.id));
    for (const [pointId, layer] of Object.entries(pointLayersRef.current)) {
      if (!activePointIds.has(pointId)) {
        layer.remove();
        delete pointLayersRef.current[pointId];
      }
    }

    points.forEach((point) => {
      let layer = pointLayersRef.current[point.id];
      const regionId = regionForPoint(point);
      const displayMeasurement = selectDisplayMeasurement(point, metric);
      const pointColor = view === "ecosystems"
        ? ecosystems[ecosystemForRegionId(regionId)].color
        : metricValueColor(metric, displayMeasurement?.value, extent);
      const readingCount = getMeasurements(point, metric).length;
      const tooltip = `${escapeHtml(point.name)}<br><strong>${escapeHtml(formatValue(displayMeasurement))}</strong>${readingCount > 1 ? `<br>${readingCount} distinct sensor series` : ""}`;
      if (!layer) {
        layer = L.circleMarker([point.lat, point.lng], { radius: readingCount ? 6 : 3.5, color: "#fff", weight: 1.5, fillColor: pointColor, fillOpacity: readingCount ? 0.95 : 0.45 }).addTo(map);
        layer.bindTooltip(tooltip, { direction: "top", offset: [0, -4] });
        layer.on("mouseover click", () => setSelectedRegionId(regionId));
        pointLayersRef.current[point.id] = layer;
      } else {
        layer.setTooltipContent(tooltip);
        layer.setStyle({ fillColor: pointColor, color: regionId === selectedRegion.id ? "#fff" : "rgba(255,255,255,.65)", fillOpacity: readingCount ? 0.95 : 0.45 });
        layer.setRadius(regionId === selectedRegion.id && readingCount ? 7 : readingCount ? 6 : 3.5);
      }
    });
  }, [extent, mapReady, metric, points, selectedRegion.id, view]);

  return (
    <section className="map-shell" aria-labelledby="bay-map-heading">
      <div className="map-toolbar">
        <div>
          <p className="section-kicker">Source explorer · big map, explicit context</p>
          <h1 id="bay-map-heading">The Bay, body of water by body of water</h1>
        </div>
        <div className="map-feed-status" aria-live="polite">
          <span className={`status-dot${loading ? " loading" : ""}`} />
          {feedStatus(feed, loading)}
        </div>
      </div>

      {(feed?.notice || requestError) && <div className={`map-feed-notice${feed?.degraded || requestError ? " degraded" : ""}`} role="status">
        <span>{requestError ?? feed?.notice}</span>
        {requestError && <button type="button" onClick={() => {
          setLoading(true);
          setRequestError(null);
          setRequestSequence((value) => value + 1);
        }}>Retry source feed</button>}
      </div>}

      <div className="map-view-switcher" role="group" aria-label="Choose how to explore the map">
        <span className="metric-switcher-label">Explore by</span>
        <button type="button" className={`map-view-chip${view === "water-quality" ? " selected" : ""}`} aria-pressed={view === "water-quality"} onClick={() => setView("water-quality")}><span aria-hidden="true">💧</span> Water quality</button>
        <button type="button" className={`map-view-chip${view === "ecosystems" ? " selected" : ""}`} aria-pressed={view === "ecosystems"} onClick={() => setView("ecosystems")}><span aria-hidden="true">🦋</span> Habitats</button>
      </div>

      {view === "water-quality" && <div className="metric-switcher" role="group" aria-label="Choose a map metric">
        <span className="metric-switcher-label">Color by</span>
        {metricKeys.map((key) => (
          <button type="button" key={key} className={`metric-chip${metric === key ? " selected" : ""}`} style={{ "--metric-color": metricDefinitions[key].colors[1] } as CSSProperties} aria-pressed={metric === key} onClick={() => setMetric(key)}>
            <span className="metric-chip-dot" aria-hidden="true" />{metricDefinitions[key].label}
          </button>
        ))}
      </div>}

      <div className="region-switcher" role="group" aria-label="Choose a Bay region">
        {summaries.map((summary) => (
          <button type="button" key={summary.region.id} className={`region-chip${summary.region.id === selectedRegion.id ? " selected" : ""}`} style={{ "--region-color": view === "ecosystems" ? ecosystems[summary.region.ecosystem].color : metricDefinitions[metric].colors[1] } as CSSProperties} aria-pressed={summary.region.id === selectedRegion.id} onClick={() => setSelectedRegionId(summary.region.id)}>
            <span className="region-chip-icon" aria-hidden="true">{ecosystems[summary.region.ecosystem].icon}</span><span className="region-chip-count">{summary.points.length}</span>{summary.region.label}
          </button>
        ))}
      </div>

      <div className="map-layout">
        <div className="bay-map-canvas" role="region" aria-label="Navigable simplified map of San Francisco Bay with selectable water regions and major city labels">
          <div className="leaflet-map-canvas" ref={mapHostRef} />
          {requestError && <div className="map-overlay-message" role="status">{requestError}</div>}
          <div className="map-scale-note">Drag to pan · hover a region · use the buttons for a complete keyboard path</div>
        </div>

        <aside className="map-detail region-detail" aria-live="polite" aria-label="Selected Bay region details">
          {selectedSummary ? <>
            <div className="map-detail-kicker"><span className="ecosystem-icon" aria-hidden="true">{selectedEcosystem.icon}</span> {view === "ecosystems" ? "Habitat view" : `${metricDefinitions[metric].label} lens`}</div>
            <h3>{selectedSummary.region.label}</h3>
            <p className="map-detail-type"><strong>{selectedEcosystem.label}</strong> · {selectedEcosystem.description}</p>
            <p className="map-detail-region-note">{selectedSummary.region.description}</p>
            <div className="region-detail-stat"><strong>{view === "ecosystems" ? selectedSummary.points.length : selectedSummary.coveredPoints}</strong><span>{view === "ecosystems" ? "source points in this region" : `source points with ${selectedSummary.seriesCount} distinct series`}</span></div>
            <div className="map-detail-band">Observed span: {selectedSummary.valueSpan}<br />Newest collection: {formatTimestamp(selectedSummary.latest?.time ?? null)}</div>
            <div className="region-point-list">
              {selectedSummary.points.length === 0 && <p className="region-empty">No source points are mapped to this region.</p>}
              {selectedSummary.points.map((point) => (
                <article className="region-point-card" key={point.id}>
                  <div className="region-point-heading">
                    <span><strong>{point.name}</strong><small>{point.id}</small></span>
                    <span className="point-links">
                      {point.stationSlug && <Link href={`/stations/${point.stationSlug}`}>Profile</Link>}
                      <a href={point.sourceUrl} target="_blank" rel="noreferrer">USGS ↗</a>
                    </span>
                  </div>
                  {view === "water-quality" && <SeriesReading point={point} metric={metric} />}
                </article>
              ))}
            </div>
            <p className="region-context-note">Each sensor series remains separate. Marker color uses the newest displayed series at a point; ties are deterministic and all underlying series are listed here.</p>
          </> : <div className="map-detail-empty"><span className="empty-state-icon" aria-hidden="true">◎</span><h3>Choose a region</h3><p>Hover, click, or tab through the region buttons to inspect the wider Bay area.</p></div>}
        </aside>
      </div>

      <div className="map-legend">
        {view === "ecosystems" ? <>
          <div><strong>Habitat color key</strong><span>Each color is a broad learning category.</span></div>
          {Object.values(ecosystems).map((ecosystem) => <div className="legend-band" key={ecosystem.label}><span className="legend-emoji" aria-hidden="true">{ecosystem.icon}</span> {ecosystem.label}</div>)}
          <div className="legend-note">This layer does not claim which species are present today.</div>
        </> : <>
          <div><strong>{metricDefinitions[metric].label} observed range</strong><span>Relative within the currently loaded source set; not a safety scale.</span></div>
          <div className="legend-band"><span className="legend-swatch" style={{ background: scaleColors[0] }} /> lower observed value</div>
          <div className="legend-band"><span className="legend-swatch" style={{ background: scaleColors[1] }} /> middle</div>
          <div className="legend-band"><span className="legend-swatch" style={{ background: scaleColors[2] }} /> higher observed value</div>
          <div className="legend-note">Gray points have no value for the selected metric. Color represents relative source values, never a regulatory threshold.</div>
        </>}
      </div>
    </section>
  );
}
