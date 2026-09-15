import Link from "next/link";
import type { Station } from "@/src/lib/data";

export function StationCard({ station }: { station: Station }) {
  const latitude = `${Math.abs(station.coordinates.lat).toFixed(4)}° ${station.coordinates.lat >= 0 ? "N" : "S"}`;
  const longitude = `${Math.abs(station.coordinates.lng).toFixed(4)}° ${station.coordinates.lng >= 0 ? "E" : "W"}`;

  return (
    <article className="station-card primary">
      <div className="card-top">
        <div>
          <div className="card-tag"><span className="status-dot" /> Coverage candidate</div>
          <h3>{station.name}</h3>
        </div>
        <span className="coordinates">{latitude}<br />{longitude}</span>
      </div>
      <p className="card-description">{station.description}</p>
      <Link className="arrow-link" href={`/stations/${station.slug}`}>Open station profile <span aria-hidden="true">→</span></Link>
    </article>
  );
}
