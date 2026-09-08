import Link from "next/link";
import type { Station } from "@/src/lib/data";

export function StationCard({ station }: { station: Station }) {
  return (
    <article className="station-card primary">
      <div className="card-top">
        <div>
          <div className="card-tag"><span className="status-dot" /> Coverage candidate</div>
          <h3>{station.name}</h3>
        </div>
        <span className="coordinates">{station.coordinates.lat}<br />{station.coordinates.lng}</span>
      </div>
      <p className="card-description">{station.description}</p>
      <Link className="arrow-link" href={`/stations/${station.slug}`}>Open station profile <span aria-hidden="true">→</span></Link>
    </article>
  );
}
