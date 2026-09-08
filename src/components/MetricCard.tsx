import type { Metric } from "@/src/lib/data";

export function MetricCard({ metric }: { metric: Metric }) {
  return (
    <article className="metric-card" aria-label={`${metric.label}: ${metric.value ?? "not available"}`}>
      <div className="metric-top">
        <span className="metric-label">{metric.label}</span>
        <span className="metric-symbol">{metric.symbol}</span>
      </div>
      <div className={`metric-value${metric.value === null ? " muted" : ""}`}>
        {metric.value ?? "Not available"}{metric.value && <span className="metric-unit"> {metric.unit}</span>}
      </div>
      <p>{metric.note}</p>
    </article>
  );
}
