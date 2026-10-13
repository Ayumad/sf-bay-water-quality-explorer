import Link from "next/link";
import { WaterDashboard } from "@/src/components/WaterDashboard";
import { stations } from "@/src/lib/data";
import { loadWaterFeed } from "@/src/lib/services/water";
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ station?: string }>;
}) {
  const [feed, search] = await Promise.all([loadWaterFeed(), searchParams]);
  return (
    <main id="main-content">
      <section className="hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-dot" /> SAN FRANCISCO BAY, EXPLAINED
            </p>
            <h1>
              Know the water.
              <br />
              <em>Meet the Bay.</em>
            </h1>
            <p>
              From the creeks to the open estuary, explore the measurements and
              living ecosystems that tell the Bay’s story.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#explore">
                Explore the Bay <span aria-hidden="true">↗</span>
              </a>
              <Link className="hero-text-link" href="/learn/metrics">
                Learn the measurements →
              </Link>
            </div>
            <div className="hero-facts">
              <span>Public data</span>
              <span>Plain-language insight</span>
              <span>No account needed</span>
            </div>
          </div>
          <div className="bay-art" aria-hidden="true">
            <svg viewBox="0 0 500 420" fill="none">
              <defs>
                <linearGradient
                  id="water"
                  x1="130"
                  y1="50"
                  x2="400"
                  y2="410"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#8DC6B8" />
                  <stop offset="1" stopColor="#276860" />
                </linearGradient>
                <pattern
                  id="grid"
                  width="32"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 32 0 L 0 0 0 32"
                    stroke="#FFFFFF"
                    strokeOpacity=".06"
                  />
                </pattern>
              </defs>
              <rect width="500" height="420" fill="url(#grid)" />
              <g stroke="#73a89c" strokeOpacity=".23">
                <path d="M0 200 Q100 170 180 220 T500 170M0 220 Q100 190 180 240 T500 190M0 240 Q100 210 180 260 T500 210M0 260 Q100 230 180 280 T500 230M0 280 Q100 250 180 300 T500 250" />
              </g>
              <path
                d="M292 34l43 24 37 17 45-8 20 27-30 18-30-9-34 23-13 40-26 29 13 29 40 38 33 50 7 50-25 30-34-20-18-49-27-36-36-30-34-29-20-41-32-14-37 8-21-16 26-15 52 8 31-21 20-37 7-36 20-13z"
                fill="url(#water)"
                stroke="#acd3be"
                strokeWidth="1.5"
              />
              <g stroke="#a1c3ad" strokeOpacity=".35">
                <path d="M130 137l35-24 55-13M365 218l38 24 21 34M148 281l43 14 29 30M263 41l-29 24-43 12" />
              </g>
              <g fill="#d4ee82">
                <circle cx="287" cy="133" r="5" />
                <circle cx="267" cy="203" r="5" />
                <circle cx="316" cy="294" r="5" />
              </g>
              <g stroke="#d4ee82" strokeOpacity=".35">
                <circle cx="267" cy="203" r="16" />
                <circle cx="267" cy="203" r="29" />
              </g>
              <text
                x="90"
                y="61"
                fill="#d9e6d8"
                fontSize="11"
                letterSpacing="3"
              >
                THE ESTUARY
              </text>
              <text
                x="48"
                y="353"
                fill="#9cb8ad"
                fontSize="11"
                letterSpacing="2"
              >
                37.8° N / 122.3° W
              </text>
            </svg>
            <div className="bay-art-label">
              <span>CONNECTED BY WATER</span>
              <strong>One Bay. Many stories.</strong>
            </div>
          </div>
        </div>
        <div className="hero-bottom shell">
          <p>
            Water quality <span>×</span> Ecological context <span>×</span> A
            little more understanding
          </p>
          <span>SCROLL TO EXPLORE ↓</span>
        </div>
      </section>
      <WaterDashboard
        stations={stations}
        initialFeed={feed}
        initialSlug={search.station}
      />
      <section className="learn-banner shell">
        <div>
          <p className="eyebrow">03 / CONNECT THE DOTS</p>
          <h2>Every number has a story.</h2>
          <p>
            What does dissolved oxygen tell us? Why does water get cloudy? Start
            with five simple guides to the measurements.
          </p>
        </div>
        <Link className="button primary" href="/learn/metrics">
          Open the field guide ↗
        </Link>
      </section>
      <section className="source-section shell">
        <p className="eyebrow">SCIENCE, WITH THE SOURCE ATTACHED</p>
        <div className="source-grid">
          <article>
            <span>01</span>
            <h3>Water measurements</h3>
            <p>
              Available USGS readings, with station, unit, sensor details, and
              collection time. EPA’s Water Quality Portal provides a separate
              path to historical samples.
            </p>
            <a
              href="https://www.waterqualitydata.us/"
              target="_blank"
              rel="noreferrer"
            >
              Explore EPA sample data ↗
            </a>
          </article>
          <article>
            <span>02</span>
            <h3>Nearby observations</h3>
            <p>
              Research-grade iNaturalist observations within 5 km over the
              previous year. Community sightings provide context, not a complete
              species inventory.
            </p>
            <a
              href="https://www.inaturalist.org/"
              target="_blank"
              rel="noreferrer"
            >
              About iNaturalist ↗
            </a>
          </article>
          <article>
            <span>03</span>
            <h3>Conservation context</h3>
            <p>
              NatureServe records matched by scientific name. Missing or
              ambiguous information stays explicitly unknown.
            </p>
            <a
              href="https://explorer.natureserve.org/"
              target="_blank"
              rel="noreferrer"
            >
              NatureServe Explorer ↗
            </a>
          </article>
        </div>
      </section>
    </main>
  );
}
