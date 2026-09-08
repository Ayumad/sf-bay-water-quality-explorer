import Link from "next/link";

export default function DataMethodsPage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell">
          <p className="section-kicker">Data methods</p>
          <h1>Clarity is part of the interface.</h1>
          <p>Baywatcher is designed to make the limits of a measurement visible, not bury them under a polished number.</p>
        </div>
      </section>
      <section className="content-section shell">
        <div className="methods-grid">
          <div className="prose">
            <h2>What this release does</h2>
            <p>This release is an educational product preview with a map-first homepage. The map is the first thing on screen: it establishes broad body-of-water regions, color-specific metric lenses, a simplified base layer, hover/focus details, measurement states, provenance affordances, and honest empty states needed for a production dashboard.</p>
            <p>The homepage requests a bounded USGS latest-continuous feed and monitoring-location metadata. If the live request is unavailable, it shows a dated source snapshot with a degraded-source label. Exact metric, depth, method, cadence, and series mappings still need a formal coverage review before the values become a production publication contract.</p>

            <h2>Why colors are metric-specific</h2>
            <p>Temperature, dissolved oxygen, pH, turbidity, and conductivity have different units and meanings, so the map uses a distinct hue for each selected lens. The selected region card reports coverage while each source point keeps its exact value and timestamp. A small lower/mid/higher visual key helps scanning, but it is not an AQI-style composite score, ecological threshold system, or safety advisory.</p>

            <h2>Why there is a habitat view</h2>
            <p>The optional habitat view uses four broad, colorful learning categories: open bay, estuary, shallow flats, and tidal marsh. They help a young learner connect a water region to the kinds of places plants and animals use. They are not live biodiversity observations, species counts, or conservation-status claims; those require a separate reviewed observation and authority workflow.</p>

            <h2>Source strategy</h2>
            <p>Modern USGS continuous data is the primary map source for recent readings. The Water Quality Portal adds historical and discrete sample context, while NOAA CO-OPS can complement coastal temperature, conductivity, salinity, tides, and currents where station coverage overlaps. These products have different semantics and should not be mixed into a single “live” card.</p>
            <p>The planned reading path is visitor → app → published database snapshot. Visitors should never trigger an unbounded upstream query. A scheduled importer will validate, normalize, and publish an atomic station/series batch after the coverage gate is passed.</p>

            <h2>Reading the four metrics</h2>
            <table className="decision-table">
              <thead><tr><th>Metric</th><th>Interface rule</th></tr></thead>
              <tbody>
                <tr><td>Temperature</td><td>Display Celsius initially; preserve the original unit and documented conversion.</td></tr>
                <tr><td>Dissolved oxygen</td><td>Keep concentration and percent saturation separate. Do not convert without the required variables and method.</td></tr>
                <tr><td>Turbidity</td><td>Keep method and unit distinctions such as NTU and FNU visible; cloudiness is not a universal safety scale.</td></tr>
                <tr><td>pH</td><td>Show the pH scale without inventing a concentration unit; preserve method metadata where supplied.</td></tr>
              </tbody>
            </table>

            <h2>Freshness and unavailable states</h2>
            <p>“Fetched now” is never substituted for “measured on.” Continuous readings, discrete samples, successful empty responses, provider failures, and withdrawn records each have distinct states. If upstream data fails, the app should keep a valid saved reading with its actual age and a degraded-source message.</p>
            <p>Not measured here, no available result, status not verified, and reviewed import pending are intentional labels. They prevent a missing value from being mistaken for zero, safety, absence, or a neighboring station’s data.</p>

            <h2>Wildlife and conservation</h2>
            <p>The planned wildlife panel is a bounded, reviewed observation import: within 5 km of a station, during the previous 12 months, with up to 20 distinct taxa. Records preserve their source links, dates, spatial-precision treatment, attribution, and licensing metadata.</p>
            <p>Conservation records remain separate from observations. A reviewed crosswalk must connect source taxon IDs to accepted scientific names and authority records. Unknown status means “Status not verified,” never “not threatened.”</p>

            <h2>Accessibility commitment</h2>
            <p>The target is WCAG 2.2 AA with manual verification. The current UI provides semantic headings, keyboard-accessible links, visible focus, text-first state labels, responsive layouts, and reduced-motion support. Region controls are keyboard-focusable and labeled; the selected detail rail is live-announced, and source points remain listed for provenance. Any future map or chart must have a complete list/table alternative.</p>

            <h2>Known gates before production</h2>
            <ul>
              <li>Capture and review actual USGS payloads for 3–5 stations and the desired metrics.</li>
              <li>Choose the managed PostgreSQL setup and migration/backup policy.</li>
              <li>Import a reviewed wildlife file and status crosswalk, or document a compliant automated path.</li>
              <li>Review the production tile-provider terms, attribution, usage budget, and fallback behavior.</li>
              <li>Run fixture-backed failure tests for timeouts, malformed payloads, empty responses, 429s, partial station failure, and overlapping imports.</li>
            </ul>
            <p><Link className="arrow-link" href="/">Return to stations <span aria-hidden="true">→</span></Link></p>
          </div>
          <aside className="method-aside">
            <h2>The small print, surfaced</h2>
            <ol>
              <li>Source and collection date travel with every displayed result.</li>
              <li>Measurement age and importer health are separate facts.</li>
              <li>Depth and method distinctions stay visible.</li>
              <li>Empty data is a product state, not an invitation to guess.</li>
              <li>This dashboard is educational, not a water-safety advisory.</li>
            </ol>
            <a href="https://api.waterdata.usgs.gov/docs/" target="_blank" rel="noreferrer">Read the USGS API docs ↗</a>
          </aside>
        </div>
      </section>
    </main>
  );
}
