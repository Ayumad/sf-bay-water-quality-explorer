"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";
import { type Station } from "@/src/lib/data";
import { escapeHtml } from "@/src/lib/map-utils";

export function ExplorerMap({
  stations,
  selected,
  onSelect,
}: {
  stations: Station[];
  selected: string;
  onSelect: (slug: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<LeafletMap | null>(null),
    markers = useRef<LayerGroup | null>(null);
  const select = useRef(onSelect);
  const [ready, setReady] = useState(false),
    [tileFailed, setTileFailed] = useState(false);
  useEffect(() => {
    select.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !container.current) return;
      const instance = L.map(container.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView([37.85, -122.2], 9);
      map.current = instance;
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        { maxZoom: 16, attribution: "Tiles © Esri — Esri, DeLorme, NAVTEQ" },
      )
        .on("tileerror", () => setTileFailed(true))
        .addTo(instance);
      markers.current = L.layerGroup().addTo(instance);
      setReady(true);
    });
    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      markers.current = null;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    let disposed = false;
    import("leaflet").then((L) => {
      if (disposed || !markers.current || !map.current) return;
      markers.current.clearLayers();
      stations.forEach((station) => {
        const active = station.slug === selected;
        const marker = L.circleMarker(
          [station.coordinates.lat, station.coordinates.lng],
          {
            radius: active ? 11 : 7,
            color: active ? "#fff" : "#0b5956",
            weight: active ? 3 : 2,
            fillColor: active ? "#d4ee82" : "#38847a",
            fillOpacity: 1,
          },
        ).addTo(markers.current!);
        marker.bindTooltip(escapeHtml(station.name), { direction: "top" });
        marker.on("click", () => select.current(station.slug));
      });
      const station = stations.find((item) => item.slug === selected);
      if (station)
        map.current.panTo([station.coordinates.lat, station.coordinates.lng], {
          animate: false,
        });
    });
    return () => {
      disposed = true;
    };
  }, [ready, stations, selected]);
  return (
    <div className="explorer-map-wrap">
      <div
        ref={container}
        className="explorer-map"
        role="region"
        aria-label="Monitoring station map. All locations are also selectable in the station list."
      />
      {!ready && <div className="map-loading">Preparing the Bay map…</div>}
      {tileFailed && (
        <p className="tile-notice" role="status">
          Map tiles are unavailable. Choose a location from the station list.
        </p>
      )}
      <div className="map-caption">
        <span>
          <i className="map-dot" /> Monitoring station
        </span>
        <span>
          <i className="map-dot selected" /> Selected location
        </span>
        <span>Markers show locations, not water-quality ratings.</span>
      </div>
    </div>
  );
}
