"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  metricDefinitions,
  metricKeys,
  type MapFeed,
  type MapMeasurement,
  type Station,
} from "@/src/lib/data";
import { ExplorerMap } from "./ExplorerMap";
import { WildlifePanel } from "./WildlifePanel";

export function displayDate(value: string | null) {
  if (!value || !Number.isFinite(Date.parse(value)))
    return "Collection time unavailable";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  }).format(new Date(value));
}
function readingLabel(reading: MapMeasurement, feed: MapFeed) {
  if (feed.mode === "captured-snapshot" || feed.degraded)
    return "Saved reading";
  return reading.freshness === "recent"
    ? "Latest available"
    : reading.freshness === "archive"
      ? "Archived reading"
      : "Older reading";
}

export function WaterDashboard({
  stations,
  initialFeed,
  initialSlug,
}: {
  stations: Station[];
  initialFeed: MapFeed;
  initialSlug?: string;
}) {
  const [selected, setSelected] = useState(
    stations.some((station) => station.slug === initialSlug)
      ? initialSlug!
      : stations[0].slug,
  );
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState("all"),
    [view, setView] = useState("map");
  const [feed, setFeed] = useState(initialFeed),
    [refreshing, setRefreshing] = useState(false),
    [refreshError, setRefreshError] = useState(false);
  const station = stations.find((item) => item.slug === selected)!;
  const point =
    feed.points.find((item) => item.id === station.providerId) ?? null;
  const filtered = useMemo(
    () =>
      stations.filter(
        (item) =>
          `${item.name} ${item.region}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()) &&
          (kind === "all" || item.type.toLowerCase().includes(kind)),
      ),
    [stations, query, kind],
  );
  function choose(slug: string) {
    setSelected(slug);
    const url = new URL(window.location.href);
    if (url.pathname.startsWith("/stations/")) {
      url.pathname = `/stations/${slug}`;
      url.searchParams.delete("station");
    } else {
      url.searchParams.set("station", slug);
    }
    window.history.replaceState(null, "", url);
  }
  async function refresh() {
    setRefreshing(true);
    setRefreshError(false);
    try {
      const response = await fetch("/api/map-points", {
        signal: AbortSignal.timeout(7_000),
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Unavailable");
      setFeed((await response.json()) as MapFeed);
    } catch {
      setRefreshError(true);
    } finally {
      setRefreshing(false);
    }
  }
  return (
    <section
      id="explore"
      className="explore-section shell"
      aria-labelledby="explore-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">01 / FIND YOUR PLACE</p>
          <h2 id="explore-heading">A closer look at the Bay.</h2>
        </div>
        <p className="section-lede">
          Choose a location. Explore what’s measured.
          <br />
          Understand what it means.
        </p>
      </div>
      <div className="explorer-toolbar">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            maxLength={100}
            placeholder="Search a station or region"
            aria-label="Search monitoring stations"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="filter-field">
          <span>Waterbody</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value)}
          >
            <option value="all">All locations</option>
            <option value="estuary">Bay / estuary</option>
            <option value="stream">Creeks / rivers</option>
          </select>
        </label>
        <div className="view-toggle" aria-label="Station view">
          <button
            type="button"
            aria-pressed={view === "map"}
            onClick={() => setView("map")}
          >
            Map + list
          </button>
          <button
            type="button"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
          >
            List only
          </button>
        </div>
      </div>
      <div className={`station-explorer ${view === "list" ? "list-only" : ""}`}>
        <aside className="station-picker" aria-label="Monitoring stations">
          <div className="picker-heading">
            <strong>{filtered.length} locations</strong>
            <span>USGS monitoring stations</span>
          </div>
          <div className="station-list">
            {filtered.map((item) => (
              <button
                className={`station-option ${selected === item.slug ? "active" : ""}`}
                key={item.slug}
                type="button"
                aria-pressed={selected === item.slug}
                onClick={() => choose(item.slug)}
              >
                <span className="location-icon" aria-hidden="true">
                  ⌖
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.type.includes("Stream")
                      ? "Creek / river"
                      : "Bay / estuary"}
                  </small>
                </span>
                <span aria-hidden="true">↗</span>
              </button>
            ))}
            {!filtered.length && (
              <div className="empty-panel">
                <h3>No matching stations</h3>
                <p>Try a different name or show all waterbodies.</p>
                <button
                  className="text-button"
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setKind("all");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </aside>
        {view === "map" && (
          <ExplorerMap
            stations={filtered}
            selected={selected}
            onSelect={choose}
          />
        )}
      </div>
      <section className="station-readings" aria-labelledby="station-heading">
        <div className="station-title-row">
          <div>
            <p className="eyebrow">02 / READ THE WATER</p>
            <h2 id="station-heading">{station.name}</h2>
            <p className="station-location">
              {station.coordinates.lat.toFixed(4)}° N ·{" "}
              {Math.abs(station.coordinates.lng).toFixed(4)}° W <span> / </span>{" "}
              {station.type}
            </p>
          </div>
          <Link className="button secondary" href={`/stations/${station.slug}`}>
            Full station profile ↗
          </Link>
        </div>
        <div
          className={`data-notice ${feed.degraded || feed.mode === "captured-snapshot" || refreshError ? "saved" : ""}`}
          role="status"
        >
          <span className="notice-symbol" aria-hidden="true">
            i
          </span>
          <div>
            <strong>
              {feed.mode === "captured-snapshot"
                ? "Saved source snapshot"
                : feed.degraded
                  ? "Source temporarily unavailable"
                  : "Latest available source data"}
            </strong>
            <p>
              {refreshError
                ? "Couldn’t refresh. Your displayed readings have been retained with their original dates."
                : feed.notice}
            </p>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={refresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh ↻"}
          </button>
        </div>
        <div className="reading-grid">
          {metricKeys.map((key) => {
            const definition = metricDefinitions[key],
              readings =
                point?.measurements.filter(
                  (reading) =>
                    reading.key === key &&
                    reading.value !== null &&
                    Number.isFinite(reading.value),
                ) ?? [];
            return (
              <article
                className="reading-card"
                key={key}
                style={
                  {
                    "--metric-color": definition.colors[2],
                  } as React.CSSProperties
                }
              >
                <div className="reading-top">
                  <span className="metric-icon" aria-hidden="true">
                    {key === "temperature"
                      ? "°"
                      : key === "dissolvedOxygen"
                        ? "O₂"
                        : key === "ph"
                          ? "pH"
                          : key === "turbidity"
                            ? "≋"
                            : "ϟ"}
                  </span>
                  <h3>{definition.label}</h3>
                </div>
                {readings.length ? (
                  readings.map((reading) => (
                    <div className="reading-series" key={reading.seriesId}>
                      <p className="reading-value">
                        {reading.value!.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                        <span>{key === "ph" ? "" : reading.unit}</span>
                      </p>
                      <span className="reading-state">
                        {readingLabel(reading, feed)}
                      </span>
                      <p className="reading-time">
                        Collected {displayDate(reading.time)}
                      </p>
                      <a
                        className="source-link"
                        href={station.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        USGS source ↗
                      </a>
                      <details className="provenance">
                        <summary>Sensor & source details</summary>
                        <dl>
                          <dt>Series</dt>
                          <dd>{reading.seriesId}</dd>
                          <dt>Depth</dt>
                          <dd>{reading.depth ?? "Not supplied"}</dd>
                          <dt>Method</dt>
                          <dd>{reading.method ?? "Not supplied"}</dd>
                          <dt>Approval</dt>
                          <dd>{reading.approvalStatus ?? "Not supplied"}</dd>
                          <dt>Qualifiers</dt>
                          <dd>
                            {reading.qualifiers.join(", ") || "None supplied"}
                          </dd>
                        </dl>
                      </details>
                    </div>
                  ))
                ) : (
                  <div className="no-reading">
                    <p className="unavailable-value">Not available</p>
                    <p>
                      No usable reading was returned for this metric at this
                      station.
                    </p>
                  </div>
                )}
                <details className="explanation">
                  <summary>
                    What does this mean? <span aria-hidden="true">+</span>
                  </summary>
                  <p>{definition.guide.reading}</p>
                  <p>{definition.guide.comparison}</p>
                  <a
                    href={definition.guide.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Learn from the source ↗
                  </a>
                </details>
              </article>
            );
          })}
        </div>
        <p className="data-footnote">
          Collection time tells you when the water was measured—not when this
          page loaded. Readings from different depths remain separate. Missing
          data never means zero.
        </p>
      </section>
      <WildlifePanel slug={selected} />
    </section>
  );
}
