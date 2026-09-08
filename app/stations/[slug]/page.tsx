import Link from "next/link";
import { notFound } from "next/navigation";
import { MetricCard } from "@/src/components/MetricCard";
import { getStation } from "@/src/lib/data";

export default async function StationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const station = getStation(slug);
  if (!station) notFound();

  return (
    <main id="main-content" className="content-section shell">
      <div className="station-detail-head">
        <div>
          <p className="breadcrumbs"><Link href="/">Explore stations</Link> <span aria-hidden="true">/</span> station profile</p>
          <h1>{station.name}</h1>
          <p>{station.type}. The profile is ready for a verified snapshot; this release keeps the reading area honest while the provider mapping is reviewed.</p>
        </div>
        <div className="station-id">{station.providerId}<br />Reviewed {station.reviewDate}</div>
      </div>

      <div className="detail-layout">
        <div>
          <section className="snapshot-panel" aria-labelledby="snapshot-heading">
            <div className="panel-heading">
              <div>
                <h2 id="snapshot-heading">Latest available snapshot</h2>
                <p>Collection time and retrieval time will be separate once a verified series is published.</p>
              </div>
              <span className="preview-pill">Preview / no live values</span>
            </div>
            <div className="metric-grid">
              {station.metrics.map((metric) => <MetricCard key={metric.key} metric={metric} />)}
            </div>
            <div className="source-strip">
              <span>Source: <a href={station.sourceUrl} target="_blank" rel="noreferrer">USGS station page ↗</a></span>
              <span>Station: {station.providerId}</span>
              <span>State: coverage candidate</span>
            </div>
          </section>

          <section className="detail-section" aria-labelledby="species-heading">
            <h2 id="species-heading">Observations near this station</h2>
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">◎</div>
              <div><h3>Reviewed wildlife import pending</h3><p>Species cards will use an attributed, bounded observation set. An empty import is not evidence that a species is absent.</p></div>
            </div>
          </section>

          <section className="detail-section" aria-labelledby="status-heading">
            <h2 id="status-heading">Conservation context</h2>
            <div className="empty-state">
              <div className="empty-state-icon" aria-hidden="true">↗</div>
              <div><h3>Status not verified in this preview</h3><p>Authority, jurisdiction, scientific name, scope, source date, and review date must be preserved before a status is shown.</p></div>
            </div>
          </section>
        </div>

        <aside className="side-stack" aria-label="Station notes">
          <div className="side-card tinted">
            <h2>What this page can say</h2>
            <p>It can describe a measurement with its provenance, unit, method, depth, qualifier, and collection date.</p>
          </div>
          <div className="side-card disclaimer">
            <h3>Not a safety advisory</h3>
            <p>These measurements provide environmental context. They do not determine whether water is safe for swimming, drinking, fishing, or pets.</p>
          </div>
          <div className="side-card">
            <h3>Map-first navigation</h3>
            <p>The homepage map is the primary selection mechanism. Station profiles remain available for deeper provenance, methods, species, and status context.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
