import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Baywatcher | SF Bay Water Quality Explorer",
    template: "%s | Baywatcher",
  },
  description:
    "Explore San Francisco Bay water measurements, plain-language explanations, nearby wildlife, and conservation context. Public data. No account needed.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/" aria-label="Baywatcher home">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path
                  d="M4 11c4-5 8 5 12 0s8 5 12 0M4 18c4-5 8 5 12 0s8 5 12 0M4 25c4-5 8 5 12 0s8 5 12 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>
                baywatcher<span className="brand-dot">.</span>
              </span>
            </Link>
            <nav className="primary-nav" aria-label="Primary navigation">
              <Link href="/#explore">Explore the Bay</Link>
              <Link href="/learn/metrics">Field guide</Link>
              <Link href="/about/data">About the data</Link>
            </nav>
            <span className="header-context">
              SF BAY WATER QUALITY EXPLORER
            </span>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell footer-grid">
            <div>
              <Link className="brand" href="/">
                baywatcher.
              </Link>
              <p>
                Understanding the water.
                <br />
                Caring about what lives in it.
              </p>
            </div>
            <div className="footer-links">
              <Link href="/#explore">Explore stations</Link>
              <Link href="/learn/metrics">Measurement field guide</Link>
              <Link href="/about/data">Sources & methods</Link>
            </div>
            <div className="footer-note">
              <strong>Built for learning.</strong>
              <p>
                Environmental context, not a drinking-water, swimming, fishing,
                or public-health advisory.
              </p>
              <span>Team SRVRRR · San Francisco Bay</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
