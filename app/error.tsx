"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main-content" className="state-page shell">
      <p className="section-kicker">Application error</p>
      <h1>The explorer hit an unexpected current.</h1>
      <p>
        No measurement should be trusted from an incomplete page. Try loading
        this view again.
      </p>
      <button className="retry-button" type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
