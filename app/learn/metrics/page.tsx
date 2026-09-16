import Link from "next/link";
import { MetricGuide } from "@/src/components/MetricGuide";
import { metricDefinitions, metricKeys } from "@/src/lib/data";

export default function MetricGuidePage() {
  return (
    <main id="main-content">
      <section className="page-hero metric-page-hero">
        <div className="shell">
          <p className="section-kicker">Water-quality field guide</p>
          <h1>Read the number. Then read its context.</h1>
          <p>Use these scales to orient yourself—not to declare water safe, unsafe, healthy, or unhealthy from one measurement.</p>
        </div>
      </section>

      <section className="content-section shell metric-guide-page" aria-labelledby="guide-heading">
        <div className="metric-guide-intro">
          <div>
            <p className="section-kicker">Five different questions</p>
            <h2 id="guide-heading">No single score tells the Bay’s story.</h2>
          </div>
          <p>Useful interpretation depends on waterbody type, location, depth, season, time of day, method, and the organisms or beneficial use being considered. Reference bands below are intentionally limited to places where broad numeric guidance is defensible.</p>
        </div>

        <nav className="metric-jump-links" aria-label="Jump to a metric">
          {metricKeys.map((key) => <a key={key} href={`#${key}`}>{metricDefinitions[key].label}</a>)}
        </nav>

        <div className="metric-guide-list">
          {metricKeys.map((key) => <MetricGuide metricKey={key} headingLevel={2} key={key} />)}
        </div>

        <aside className="metric-safety-note">
          <div><strong>What these guides do</strong><p>Explain direction, common context, and broad aquatic-life references.</p></div>
          <div><strong>What they do not do</strong><p>Replace local standards, multi-day assessment, laboratory QA, or public-health advisories.</p></div>
          <Link className="arrow-link" href="/about/data">Read the data and publication methods <span aria-hidden="true">→</span></Link>
        </aside>
      </section>
    </main>
  );
}
