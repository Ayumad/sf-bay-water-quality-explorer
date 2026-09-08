import Link from "next/link";
import { BayMap } from "@/src/components/BayMap";
import { metricDefinitions } from "@/src/lib/data";

export default function HomePage() {
  return (
    <>
      <main id="main-content">
        <section className="main-section shell map-first-section" aria-labelledby="bay-map-heading">
          <BayMap />

          <div className="map-source-callout">
            <div><p className="section-kicker">02 / expand coverage</p><h2>More than one source, never less context.</h2></div>
            <div className="source-callout-grid">
              <article><span className="source-number">01</span><h3>USGS continuous</h3><p>Primary map feed: bounded latest-continuous observations plus monitoring-location metadata.</p><a href="https://api.waterdata.usgs.gov/docs/ogcapi/" target="_blank" rel="noreferrer">API docs ↗</a></article>
              <article><span className="source-number">02</span><h3>EPA Water Quality Portal</h3><p>Historical and discrete samples broaden geography; they stay labeled as sample records, not live sensor readings.</p><a href="https://www.waterqualitydata.us/beta/webservices_documentation/" target="_blank" rel="noreferrer">Web services ↗</a></article>
              <article><span className="source-number">03</span><h3>NOAA CO-OPS</h3><p>Complementary coastal temperature, conductivity, salinity, tides, and currents where station coverage overlaps.</p><a href="https://api.tidesandcurrents.noaa.gov/api/dev" target="_blank" rel="noreferrer">Data API ↗</a></article>
            </div>
          </div>

          <section className="why-grid" aria-labelledby="why-heading">
            <div className="why-copy">
              <p className="section-kicker">03 / learn the signal</p>
              <h2 id="why-heading">Four measurements, four different stories.</h2>
              <p>Water-quality numbers are clues about conditions, not a single “good” or “bad” score. Read the unit, collection time, method, and source alongside every result.</p>
              <Link className="arrow-link" href="/about/data">See the data methods <span aria-hidden="true">→</span></Link>
            </div>
            <div className="metric-explainers">
              {Object.values(metricDefinitions).slice(0, 4).map((metric) => (
                <article className="explainer" key={metric.label}>
                  <h3>{metric.label} <span className="metric-symbol">{metric.symbol}</span></h3>
                  <p>{metric.explanation}</p>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}
