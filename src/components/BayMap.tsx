"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { CircleMarker, Map as LeafletMap, Marker, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { MetricScale } from "@/src/components/MetricGuide";
import { metricDefinitions, metricKeys } from "@/src/lib/data";
import type { MapFeed, MapPoint, MetricKey } from "@/src/lib/data";
import {
  escapeHtml,
  formatValue,
  freshnessLabel,
  getMeasurements,
  getSeries,
  metricVisualScale,
  metricValueColor,
  regionSummary,
  selectDisplayMeasurement,
} from "@/src/lib/map-utils";
import {
  habitatCategories,
  majorCities,
  regionForPoint,
  regions,
} from "@/src/lib/regions";

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
  if (!measurements.length) return <p className="series-empty"><strong>{metricDefinitions[metric].label} data unavailable.</strong> This station does not currently provide a usable series for the selected metric.</p>;

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
          <details className="series-technical">
            <summary>Technical source details</summary>
            <span>Series {measurement.seriesId}</span>
            <span>Parameter {measurement.parameterCode}{measurement.statisticId ? ` · statistic ${measurement.statisticId}` : ""}</span>
            <span>{measurement.approvalStatus ?? "Approval status not supplied"}{measurement.qualifiers.length ? ` · ${measurement.qualifiers.join(", ")}` : ""}</span>
          </details>
        </div>
      ))}
    </div>
  );
}

export function BayMap() {
  const mapHostRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<LeafletApi | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const habitatLayerRef = useRef<TileLayer | null>(null);
  const cityLabelsRef = useRef<Marker[]>([]);
  const regionLabelsRef = useRef<Marker[]>([]);
  const pointLayersRef = useRef<Record<string, CircleMarker>>({});
  const [feed, setFeed] = useState<MapFeed | null>(null);
  const [metric, setMetric] = useState<MetricKey>("temperature");
  const [view, setView] = useState<MapView>("water-quality");
  const [selectedRegionId, setSelectedRegionId] = useState("central-bay");
  const [loading, setLoading] = useState(true);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSequence, setRequestSequence] = useState(0);
  const [mapReady, setMapReady] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);

  const points = useMemo(() => feed?.points ?? [], [feed]);
  const availablePoints = useMemo(() => points.filter((point) => getMeasurements(point, metric).length > 0), [points, metric]);
  const pointsWithAnyData = useMemo(() => points.filter((point) => point.measurements.some((measurement) => measurement.value !== null)), [points]);
  const displayedPoints = useMemo(
    () => view === "ecosystems" ? pointsWithAnyData : showUnavailable ? pointsWithAnyData : availablePoints,
    [availablePoints, pointsWithAnyData, showUnavailable, view],
  );
  const hiddenUnavailableCount = Math.max(0, pointsWithAnyData.length - availablePoints.length);
  const visualScale = useMemo(() => metricVisualScale(availablePoints, metric), [availablePoints, metric]);
  const extent = visualScale.extent;
  const summaries = useMemo(() => regions.map((region) => regionSummary(region, displayedPoints, metric)), [displayedPoints, metric]);
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? regions[0];
  const selectedSummary = summaries.find((summary) => summary.region.id === selectedRegion.id) ?? summaries[0];
  const scaleColors = metricDefinitions[metric].colors;

  function chooseRegion(regionId: string) {
    setSelectedRegionId(regionId);
    const region = regions.find((candidate) => candidate.id === regionId);
    if (region && mapRef.current) mapRef.current.flyTo(region.labelPosition, Math.max(mapRef.current.getZoom(), 10), { duration: 0.45 });
  }

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
        icon: L.divIcon({ className: "water-region-label", html: `<span>${region.label}</span>`, iconSize: [0, 0], iconAnchor: [0, 0] }),
        zIndexOffset: 450,
      }).addTo(map));
      leafletRef.current = L;
      mapRef.current = map;
      setMapReady(true);
      requestAnimationFrame(() => map.invalidateSize());
    });
    return () => {
      cancelled = true;
      habitatLayerRef.current?.remove();
      Object.values(pointLayersRef.current).forEach((layer) => layer.remove());
      cityLabelsRef.current.forEach((layer) => layer.remove());
      regionLabelsRef.current.forEach((layer) => layer.remove());
      cityLabelsRef.current = [];
      regionLabelsRef.current = [];
      habitatLayerRef.current = null;
      pointLayersRef.current = {};
      mapRef.current?.remove();
      mapRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const L = leafletRef.current;
    if (!map || !L || !mapReady) return;
    if (view === "ecosystems") {
      const habitatLayer = habitatLayerRef.current ?? L.tileLayer(
        "https://tiles.arcgis.com/tiles/8V9ShUQ1DGYVLtOg/arcgis/rest/services/BaylandsHabitatMap2020_v1_1/MapServer/tile/{z}/{y}/{x}",
        {
          minZoom: 9,
          minNativeZoom: 10,
          maxNativeZoom: 14,
          maxZoom: 15,
          opacity: 0.76,
          className: "habitat-tile-layer",
          attribution: "Habitats &copy; San Francisco Estuary Institute & Aquatic Science Center",
        },
      );
      habitatLayerRef.current = habitatLayer;
      if (!map.hasLayer(habitatLayer)) habitatLayer.addTo(map);
    } else if (habitatLayerRef.current && map.hasLayer(habitatLayerRef.current)) {
      habitatLayerRef.current.removeFrom(map);
    }
  }, [mapReady, view]);

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
    const activePointIds = new Set(displayedPoints.map((point) => point.id));
    for (const [pointId, layer] of Object.entries(pointLayersRef.current)) {
      if (!activePointIds.has(pointId)) {
        layer.remove();
        delete pointLayersRef.current[pointId];
      }
    }

    displayedPoints.forEach((point) => {
      let layer = pointLayersRef.current[point.id];
      const regionId = regionForPoint(point);
      const displayMeasurement = selectDisplayMeasurement(point, metric);
      const comparableMeasurement = displayMeasurement?.unit === visualScale.unit ? displayMeasurement : undefined;
      const pointColor = view === "ecosystems"
        ? "#ff806b"
        : metricValueColor(metric, comparableMeasurement?.value, extent);
      const readingCount = getMeasurements(point, metric).length;
      const readingLabel = displayMeasurement
        ? formatValue(displayMeasurement)
        : `${metricDefinitions[metric].label} data unavailable`;
      const comparisonNote = displayMeasurement && !comparableMeasurement
        ? "<br><small>Shown without scale color because its unit differs</small>"
        : "";
      const tooltip = `${escapeHtml(point.name)}<br><strong>${escapeHtml(readingLabel)}</strong>${readingCount > 1 ? `<br>${readingCount} distinct sensor series` : ""}${comparisonNote}`;
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
  }, [displayedPoints, extent, mapReady, metric, selectedRegion.id, view, visualScale.unit]);

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
        <button type="button" className={`map-view-chip${view === "ecosystems" ? " selected" : ""}`} aria-pressed={view === "ecosystems"} onClick={() => setView("ecosystems")}><span aria-hidden="true">◫</span> Mapped habitats</button>
      </div>

      {view === "water-quality" && <div className="metric-switcher" role="group" aria-label="Choose a map metric">
        <span className="metric-switcher-label">Color by</span>
        {metricKeys.map((key) => (
          <button type="button" key={key} className={`metric-chip${metric === key ? " selected" : ""}`} style={{ "--metric-color": metricDefinitions[key].colors[1] } as CSSProperties} aria-pressed={metric === key} onClick={() => { setMetric(key); setShowUnavailable(false); }}>
            <span className="metric-chip-dot" aria-hidden="true" />{metricDefinitions[key].label}
          </button>
        ))}
      </div>}

      {view === "water-quality" && <div className="map-metric-guide">
        <div>
          <p className="map-guide-question">{metricDefinitions[metric].guide.question}</p>
          <p>{metricDefinitions[metric].guide.reading}</p>
          <Link href={`/learn/metrics#${metric}`}>Open the complete metric guide →</Link>
        </div>
        <MetricScale metricKey={metric} compact />
      </div>}

      {view === "water-quality" && <div className="map-availability-row" aria-live="polite">
        <span>Showing {availablePoints.length} of {pointsWithAnyData.length} stations with {metricDefinitions[metric].label.toLowerCase()} data.</span>
        {hiddenUnavailableCount > 0 && <label className="availability-toggle">
          <input type="checkbox" checked={showUnavailable} onChange={(event) => setShowUnavailable(event.target.checked)} />
          Show {hiddenUnavailableCount} unavailable {hiddenUnavailableCount === 1 ? "station" : "stations"}
        </label>}
      </div>}

      <div className="region-switcher" role="group" aria-label="Choose a Bay region">
        {summaries.map((summary) => (
          <button type="button" key={summary.region.id} className={`region-chip${summary.region.id === selectedRegion.id ? " selected" : ""}`} style={{ "--region-color": metricDefinitions[metric].colors[1] } as CSSProperties} aria-pressed={summary.region.id === selectedRegion.id} onClick={() => chooseRegion(summary.region.id)}>
            <span className="region-chip-count">{summary.points.length}</span>{summary.region.label}
          </button>
        ))}
      </div>

      <div className="map-layout">
        <div className="bay-map-canvas" role="region" aria-label="Navigable map of San Francisco Bay with monitoring stations, named Bay areas, and an optional SFEI habitat layer">
          <div className="leaflet-map-canvas" ref={mapHostRef} />
          {requestError && <div className="map-overlay-message" role="status">{requestError}</div>}
          <div className="map-scale-note">Drag to pan · habitat shapes follow the SFEI Baylands Habitat Map 2020</div>
        </div>

        <aside className="map-detail region-detail" aria-live="polite" aria-label="Selected Bay region details">
          {selectedSummary ? <>
            <div className="map-detail-kicker">{view === "ecosystems" ? "Mapped Bay habitats · 2020 conditions" : `${metricDefinitions[metric].label} lens`}</div>
            <h3>{selectedSummary.region.label}</h3>
            <p className="map-detail-region-note">{selectedSummary.region.description}</p>
            <div className="region-detail-stat"><strong>{view === "ecosystems" ? selectedSummary.points.length : selectedSummary.coveredPoints}</strong><span>{view === "ecosystems" ? "source points in this region" : `source points with ${selectedSummary.seriesCount} distinct series`}</span></div>
            {view === "ecosystems"
              ? <div className="map-detail-band">The map colors show mapped habitat footprints, not generalized region fills. Station grouping is for navigation only.</div>
              : <div className="map-detail-band">Observed span: {selectedSummary.valueSpan}<br />Newest collection: {formatTimestamp(selectedSummary.latest?.time ?? null)}</div>}
            <div className="region-point-list">
              {selectedSummary.points.length === 0 && <p className="region-empty">No source points are mapped to this region.</p>}
              {selectedSummary.points.map((point) => (
                <article className="region-point-card" key={point.id}>
                  <div className="region-point-heading">
                    <span><strong>{point.name}</strong><small>{point.siteType}</small></span>
                    <span className="point-links">
                      {point.stationSlug && <Link href={`/stations/${point.stationSlug}`}>Profile</Link>}
                      <a href={point.sourceUrl} target="_blank" rel="noreferrer">USGS ↗</a>
                    </span>
                  </div>
                  {view === "water-quality" && <SeriesReading point={point} metric={metric} />}
                </article>
              ))}
            </div>
            <p className="region-context-note">{view === "ecosystems" ? "Habitat geometry is sourced from SFEI and represents 2020 conditions. Coral station markers are independent monitoring locations, not habitat centroids." : "Each sensor series remains separate. Marker color uses the newest comparable displayed series at a point; ties are deterministic and all underlying series are listed here."}</p>
          </> : <div className="map-detail-empty"><span className="empty-state-icon" aria-hidden="true">◎</span><h3>Choose a region</h3><p>Hover, click, or tab through the region buttons to inspect the wider Bay area.</p></div>}
        </aside>
      </div>

      <div className="map-legend">
        {view === "ecosystems" ? <>
          <div><strong>SFEI Baylands Habitat Map 2020</strong><span>Published habitat geometry across the complete main Bay; colors follow mapped Level 4 classes.</span></div>
          {habitatCategories.map((habitat) => <div className="legend-band" key={habitat.key}><span className="legend-swatch" style={{ background: habitat.color }} /> {habitat.label}</div>)}
          <div className="legend-note">2020 conditions, not a live habitat survey or jurisdiction map. <a href="https://www.sfei.org/projects/baylands-habitat-map-2020" target="_blank" rel="noreferrer">Source and methods ↗</a></div>
        </> : <>
          <div><strong>{metricDefinitions[metric].label} observed range</strong><span>Relative within comparable {visualScale.unit ?? "source-unit"} readings; not a safety scale.</span></div>
          {extent ? <>
            <div className="legend-band"><span className="legend-swatch" style={{ background: scaleColors[0] }} /> {extent[0].toLocaleString(undefined, { maximumFractionDigits: 2 })} {visualScale.unit}</div>
            <div className="legend-band"><span className="legend-swatch" style={{ background: scaleColors[1] }} /> {((extent[0] + extent[1]) / 2).toLocaleString(undefined, { maximumFractionDigits: 2 })} {visualScale.unit}</div>
            <div className="legend-band"><span className="legend-swatch" style={{ background: scaleColors[2] }} /> {extent[1].toLocaleString(undefined, { maximumFractionDigits: 2 })} {visualScale.unit}</div>
          </> : <div className="legend-band">No comparable values are available for this metric.</div>}
          <div className="legend-note">Stations without this metric are hidden by default. Gray points, when revealed, mean data unavailable—not zero. {visualScale.excludedPoints ? `${visualScale.excludedPoints} reading${visualScale.excludedPoints === 1 ? " uses" : "s use"} a different unit and is not merged into this color scale.` : ""}</div>
        </>}
      </div>
    </section>
  );
}
