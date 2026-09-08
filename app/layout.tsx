import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Baywatcher | SF Bay Water Quality Explorer",
  description:
    "An educational, account-free guide to understanding water-quality measurements around San Francisco Bay.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="shell header-inner">
            <Link className="brand" href="/" aria-label="Baywatcher home">
              <span className="brand-mark" aria-hidden="true"><span /></span>
              <span>baywatcher<span className="brand-dot">.</span></span>
            </Link>
            <nav className="primary-nav" aria-label="Primary navigation">
              <Link href="/">Explore stations</Link>
              <Link href="/about/data">How to read this</Link>
            </nav>
            <span className="header-status"><span className="status-dot" /> Prototype preview</span>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="shell footer-grid">
            <div>
              <Link className="brand footer-brand" href="/">baywatcher<span className="brand-dot">.</span></Link>
              <p className="footer-copy">A calm, careful way to understand the Bay’s water data.</p>
            </div>
            <div className="footer-links">
              <Link href="/about/data">Data methods</Link>
              <a href="https://waterdata.usgs.gov/monitoring-location/USGS-11162765/" target="_blank" rel="noreferrer">USGS station ↗</a>
              <a href="https://www.usgs.gov/products/water-resources/online-water-data" target="_blank" rel="noreferrer">About USGS data ↗</a>
            </div>
            <div className="footer-note">Built for learning, not for safety decisions.</div>
          </div>
        </footer>
      </body>
    </html>
  );
}
