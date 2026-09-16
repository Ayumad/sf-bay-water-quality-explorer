import Link from "next/link";
import { BayMap } from "@/src/components/BayMap";
import { MetricExplorer } from "@/src/components/MetricExplorer";
import { StationCard } from "@/src/components/StationCard";
import { stations } from "@/src/lib/data";

export default function HomePage() {
  return (
    <>
      <main id="main-content">
        <section className="main-section shell map-first-section" aria-labelledby="bay-map-heading">
          <BayMap />

          <section className="station-catalog" aria-labelledby="station-catalog-heading">
            <div className="section-head">
              <div>
                <p className="section-kicker">02 / inspect a candidate</p>
                <h2 id="station-catalog-heading">Station profiles keep the review gate visible.</h2>
              </div>
              <p className="section-subtitle">The map can expose candidate source series for exploration. A station profile stays unpublished until its exact depth and series choices are approved.</p>
            </div>
            <div className="station-grid">
              {stations.map((station) => <StationCard key={station.slug} station={station} />)}
              <article className="station-card pending-card">
                <div className="card-tag">Coverage worklist</div>
                <h3>Expand only after each series is understood.</h3>
                <p>New stations need an exact time-series ID, parameter, unit, depth, cadence, and review record.</p>
                <div className="pending-list">
                  <div className="pending-row"><span>Configured profiles</span><span>{stations.length}</span></div>
                  <div className="pending-row"><span>Publication state</span><span>Candidate</span></div>
                </div>
              </article>
            </div>
          </section>

          <div className="map-source-callout">
            <div><p className="section-kicker">03 / expand coverage</p><h2>More than one source, never less context.</h2></div>
            <div className="source-callout-grid">
              <article><span className="source-number">01</span><h3>USGS continuous</h3><p>Primary source preview: latest observations joined to location and exact time-series metadata.</p><a href="https://api.waterdata.usgs.gov/docs/ogcapi/" target="_blank" rel="noreferrer">API docs ↗</a></article>
              <article><span className="source-number">02</span><h3>EPA Water Quality Portal</h3><p>Historical and discrete samples broaden geography; they stay labeled as sample records, not live sensor readings.</p><a href="https://www.waterqualitydata.us/beta/webservices_documentation/" target="_blank" rel="noreferrer">Web services ↗</a></article>
              <article><span className="source-number">03</span><h3>NOAA CO-OPS</h3><p>Complementary coastal temperature, conductivity, salinity, tides, and currents where station coverage overlaps.</p><a href="https://api.tidesandcurrents.noaa.gov/api/dev" target="_blank" rel="noreferrer">Data API ↗</a></article>
            </div>
          </div>

          <section className="why-grid" aria-labelledby="why-heading">
            <div className="why-copy">
            <p className="section-kicker">04 / learn the signal</p>
              <h2 id="why-heading">Five measurements, five different stories.</h2>
              <p>Water-quality numbers are clues about conditions, not a single “good” or “bad” score. Read the unit, collection time, method, and source alongside every result.</p>
              <Link className="arrow-link" href="/learn/metrics">Open the complete metric guide <span aria-hidden="true">→</span></Link>
            </div>
            <MetricExplorer />
          </section>
        </section>
      </main>
    </>
  );
}
