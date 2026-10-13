"use client";
import Link from "next/link";
import { SpeciesPhoto } from "./SpeciesPhoto";
import { useEffect, useState } from "react";
import type { WildlifeResult } from "@/src/lib/services/wildlife";

export function WildlifePanel({
  slug,
  stationName,
}: {
  slug: string;
  stationName: string;
}) {
  const [state, setState] = useState<{
    slug: string;
    result?: WildlifeResult;
    failed?: boolean;
  }>({ slug: "" });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/stations/${encodeURIComponent(slug)}/wildlife`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unavailable");
        return response.json() as Promise<WildlifeResult>;
      })
      .then((result) => {
        if (!controller.signal.aborted) setState({ slug, result });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ slug, failed: true });
      });
    return () => controller.abort();
  }, [slug, attempt]);
  const loading = state.slug !== slug,
    result = !loading ? state.result : undefined;
  const retry = () => {
    setState({ slug: "" });
    setAttempt((value) => value + 1);
  };
  return (
    <section
      id="wildlife"
      className="wildlife-section"
      aria-labelledby="wildlife-heading"
      aria-busy={loading}
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">03 / MEET THE NEIGHBORS</p>
          <h2 id="wildlife-heading">Life near this station.</h2>
        </div>
        <span className="pill">Within 5 km · previous year</span>
      </div>
      <p className="section-lede">
        Discover species observed near {stationName}. Sightings give ecological
        context, not a complete inventory or a direct link to any one water
        reading.
      </p>
      {loading ? (
        <div className="wildlife-loading" role="status">
          <span className="spinner" /> Looking for nearby observations…
          <p>Your water measurements are ready above.</p>
        </div>
      ) : (
        <>
          <p
            className={`wildlife-status ${result?.isFallback || state.failed ? "is-fallback" : ""}`}
            role="status"
          >
            {result?.message ??
              "Wildlife observations are temporarily unavailable. Water measurements remain available."}
          </p>
          {!!result?.data.length && (
            <div className="wildlife-grid">
              {result.data.map((animal) => (
                <article className="species-card" key={animal.taxonId}>
                  <SpeciesPhoto animal={animal} />
                  <div className="species-content">
                    <h3>{animal.commonName}</h3>
                    <p className="scientific-name">{animal.scientificName}</p>
                    <p
                      className={`conservation-label ${animal.status?.isAtRisk ? "at-risk" : ""}`}
                    >
                      {animal.status?.label ??
                        "Conservation status unavailable"}
                    </p>
                    <p className="species-date">Observed {animal.observedOn}</p>
                    <a href={animal.sourceUrl} target="_blank" rel="noreferrer">
                      iNaturalist observation ↗
                    </a>
                    {animal.status && (
                      <a
                        href={animal.status.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        NatureServe record ↗
                      </a>
                    )}
                    {animal.attribution && (
                      <p className="photo-credit">
                        {animal.attribution} · {animal.license?.toUpperCase()}
                        {animal.imageSourceUrl && (
                          <>
                            {" "}
                            ·{" "}
                            <a
                              href={animal.imageSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Photo source ↗
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          {(result?.isFallback || state.failed) && (
            <button type="button" className="button secondary" onClick={retry}>
              Retry wildlife
            </button>
          )}
          <div className="explore-next">
            <div>
              <p className="eyebrow">04 / MAKE SENSE OF IT</p>
              <h3>What connects water and wildlife?</h3>
              <p>
                Explore how temperature, oxygen, and other measurements shape
                the conditions organisms live in.
              </p>
            </div>
            <Link
              className="button secondary"
              href={`/learn/metrics?station=${slug}`}
            >
              Continue to the field guide →
            </Link>
          </div>
          <p className="small-note">
            Status is attached only to an exact, unambiguous scientific-name
            match. Unknown means unverified, not unthreatened. NatureServe
            global ranks describe conservation risk and are separate from legal
            listings.
          </p>
        </>
      )}
    </section>
  );
}
