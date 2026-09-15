import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main id="main-content" className="state-page shell">
      <p className="section-kicker">404 / not found</p>
      <h1>This water trail ends here.</h1>
      <p>The station or page you requested is not part of the reviewed explorer.</p>
      <Link className="arrow-link" href="/">Return to the Bay map <span aria-hidden="true">→</span></Link>
    </main>
  );
}
