import Link from "next/link";
import type { CSSProperties } from "react";
import { metricDefinitions } from "@/src/lib/data";
import type { MetricKey } from "@/src/lib/data";

function rangeLabel(value: number, unit: string) {
  return `${value.toLocaleString()}${unit === "pH" ? "" : ` ${unit}`}`;
}

export function MetricScale({ metricKey, compact = false }: { metricKey: MetricKey; compact?: boolean }) {
  const definition = metricDefinitions[metricKey];
  const reference = definition.guide.reference;

  if (!reference) {
    return (
      <div className={`relationship-guide${compact ? " compact" : ""}`} aria-label={`${definition.guide.lowLabel} to ${definition.guide.highLabel}; context-dependent, not a safety scale`}>
        <div className="relationship-track" style={{ "--guide-start": definition.colors[0], "--guide-end": definition.colors[2] } as CSSProperties} />
        <div className="relationship-labels"><span>{definition.guide.lowLabel}</span><span>{definition.guide.highLabel}</span></div>
        {!compact && <p>No universal threshold: use local history, season, depth, and method.</p>}
      </div>
    );
  }

  return (
    <div className={`reference-guide${compact ? " compact" : ""}`}>
      <div className="reference-title"><strong>{reference.title}</strong><span>{reference.min}–{reference.max} {reference.unit}</span></div>
      <div className="reference-track" role="img" aria-label={reference.bands.map((band) => `${rangeLabel(band.from, reference.unit)} to ${rangeLabel(band.to, reference.unit)}: ${band.label}`).join("; ")}>
        {reference.bands.map((band) => (
          <span
            className={`reference-segment ${band.tone}`}
            key={`${band.from}-${band.to}`}
            style={{ width: `${((band.to - band.from) / (reference.max - reference.min)) * 100}%` }}
          />
        ))}
      </div>
      <div className="reference-endpoints"><span>{reference.min}</span><span>{reference.max} {reference.unit}</span></div>
      {!compact && <div className="reference-band-list">
        {reference.bands.map((band) => (
          <div key={band.label}><span className={`reference-dot ${band.tone}`} aria-hidden="true" /><strong>{band.from}–{band.to}</strong><span>{band.label}</span></div>
        ))}
      </div>}
      <p>{reference.note}</p>
    </div>
  );
}

export function MetricGuide({ metricKey, headingLevel = 3 }: { metricKey: MetricKey; headingLevel?: 2 | 3 }) {
  const definition = metricDefinitions[metricKey];
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <article className="metric-guide" id={metricKey}>
      <div className="metric-guide-heading">
        <div>
          <p className="metric-guide-question">{definition.guide.question}</p>
          <Heading>{definition.label} <span>{definition.symbol}</span></Heading>
        </div>
        <span className="metric-parameter">USGS {definition.parameterCode}</span>
      </div>
      <p className="metric-guide-reading">{definition.guide.reading}</p>
      <MetricScale metricKey={metricKey} />
      <p className="metric-guide-comparison"><strong>Read it with context.</strong> {definition.guide.comparison}</p>
      <a className="metric-source-link" href={definition.guide.sourceUrl} target="_blank" rel="noreferrer">{definition.guide.sourceLabel} ↗</a>
      <Link className="metric-method-link" href="/about/data">How Baywatcher handles this data →</Link>
    </article>
  );
}
