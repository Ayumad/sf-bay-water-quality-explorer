import Link from "next/link";
export default function DataMethodsPage() {
  return (
    <main id="main-content">
      <section className="page-hero">
        <div className="shell">
          <p className="eyebrow">SOURCES & METHODS</p>
          <h1>
            A clearer view.
            <br />
            <em>An honest picture.</em>
          </h1>
          <p>
            Every reading has a place, a date, and a source. Here’s how to
            understand what you’re seeing.
          </p>
        </div>
      </section>
      <section className="content-section shell methods-grid">
        <div className="prose">
          <h2>What Baywatcher does</h2>
          <p>
            Baywatcher is an educational explorer for selected San Francisco Bay
            and watershed monitoring locations. Choose a station from the map or
            searchable list, read available water measurements and explanations,
            and explore community wildlife observations nearby. No account is
            needed.
          </p>
          <h2>Measurements, not safety scores</h2>
          <p>
            A single number cannot determine whether a location is safe for
            drinking, swimming, fishing, or pets. We preserve units, collection
            time, source, sensor depth, method, and qualifiers when the provider
            supplies them. Different sensor depths remain separate; missing
            values are never replaced by zero.
          </p>
          <p>
            Our <Link href="/learn/metrics">field guide</Link> explains each
            metric’s meaning and ecological context. Broad reference bands are
            contextual learning aids, not local compliance assessments.
          </p>
          <h2>Live requests and saved readings</h2>
          <p>
            USGS is the active water-data integration. The server makes bounded
            requests for the configured stations. If the provider fails or
            exceeds a five-second request timeout, we retain the last successful
            response available in that server instance, or return the dated
            source snapshot inherited from the first release.
          </p>
          <p>
            The saved snapshot was captured on September 8, 2026. Its early
            records did not retain exact series/depth metadata; they are labeled
            saved source readings, not approved current station conditions.
            Public station names and coordinates were checked against USGS
            monitoring-location metadata during this refactor. Exact historical
            sensor identities still need review. An archived reading may be much
            older than the snapshot date.
          </p>
          <p>
            Each card shows its original collection date. Fetching or refreshing
            a page does not make a measurement newer. A successful empty
            response shows no available readings rather than silently
            manufacturing data.
          </p>
          <h2>Wildlife and conservation</h2>
          <p>
            iNaturalist provides up to six distinct taxa from a bounded request
            for research-grade observations within 5 km during the previous
            year. A sighting describes a community observation; it does not
            prove habitat occupancy today or establish an ecological effect from
            a particular water measurement.
          </p>
          <p>
            NatureServe conservation records are queried by exact scientific
            name. We display a status only when one unambiguous record matches.
            Global ranks describe conservation risk and are distinct from
            federal threatened/endangered listings. Provider identifiers and
            common names are never treated as interchangeable taxonomic keys.
          </p>
          <p>
            Conservation lookup failures do not hide species observations.
            Wildlife outages do not hide water data. Saved wildlife results keep
            their original observation dates. Unknown status does not mean
            unthreatened, and no observations does not mean no wildlife.
          </p>
          <p>
            Only explicitly reusable observation photos are displayed, with the
            returned attribution and license. Exact observation coordinates are
            not shown.
          </p>
          <h2>The sources</h2>
          <ul>
            <li>
              <a
                href="https://api.waterdata.usgs.gov/docs/"
                target="_blank"
                rel="noreferrer"
              >
                USGS Water Data
              </a>{" "}
              — current integration for continuous measurements and station
              metadata.
            </li>
            <li>
              <a
                href="https://www.waterqualitydata.us/"
                target="_blank"
                rel="noreferrer"
              >
                EPA Water Quality Portal
              </a>{" "}
              — historical/discrete sample resource; not presented as an active
              live feed in this release.
            </li>
            <li>
              <a
                href="https://www.inaturalist.org/"
                target="_blank"
                rel="noreferrer"
              >
                iNaturalist
              </a>{" "}
              — attributed nearby observations.
            </li>
            <li>
              <a
                href="https://explorer.natureserve.org/"
                target="_blank"
                rel="noreferrer"
              >
                NatureServe Explorer
              </a>{" "}
              — conservation ranks and available federal status information.
            </li>
            <li>
              Esri World Light Gray — map tiles. The station list remains usable
              if tiles fail.
            </li>
          </ul>
          <h2>Built to remain understandable</h2>
          <p>
            The list is a complete alternative to map selection. Controls
            support keyboard navigation, status messages use text, and layouts
            adapt to desktop and mobile. An older response for one station
            cannot replace the wildlife results for a newly selected station.
          </p>
          <p>
            API requests and secrets stay server-side. Public routes accept only
            configured station slugs, responses are validated, and provider text
            is rendered as text. Accounts, alerts, and visitor database writes
            are outside this MVP.
          </p>
          <h2>Before a production release</h2>
          <p>
            Review the exact historical sensor identities, confirm current data
            coverage, run deployed accessibility/performance checks, and decide
            whether persistent Supabase caching is needed. Server-instance
            caches are temporary and do not survive all redeployments or cold
            starts.
          </p>
        </div>
        <aside className="method-aside">
          <p className="eyebrow">A FEW THINGS TO REMEMBER</p>
          <h2>Read the context.</h2>
          <ol>
            <li>Collection date ≠ page-load date.</li>
            <li>Missing data ≠ zero.</li>
            <li>Unknown status ≠ unthreatened.</li>
            <li>A nearby sighting ≠ a census.</li>
            <li>Environmental context ≠ a safety advisory.</li>
          </ol>
          <Link href="/#explore">Back to the explorer →</Link>
        </aside>
      </section>
    </main>
  );
}
