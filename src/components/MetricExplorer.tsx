"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { MetricGuide } from "@/src/components/MetricGuide";
import { metricDefinitions, metricKeys } from "@/src/lib/data";
import type { MetricKey } from "@/src/lib/data";

export function MetricExplorer() {
  const [metric, setMetric] = useState<MetricKey>("dissolvedOxygen");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % metricKeys.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + metricKeys.length) % metricKeys.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = metricKeys.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    setMetric(metricKeys[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  }

  return (
    <div className="metric-explorer">
      <div className="metric-explorer-tabs" role="tablist" aria-label="Choose a metric to explain">
        {metricKeys.map((key, index) => (
          <button
            type="button"
            role="tab"
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`metric-tab-${key}`}
            aria-controls="metric-explorer-panel"
            aria-selected={metric === key}
            tabIndex={metric === key ? 0 : -1}
            className={metric === key ? "selected" : ""}
            key={key}
            onClick={() => setMetric(key)}
            onKeyDown={(event) => moveTab(event, index)}
          >
            {metricDefinitions[key].label}
          </button>
        ))}
      </div>
      <div id="metric-explorer-panel" role="tabpanel" aria-labelledby={`metric-tab-${metric}`}>
        <MetricGuide metricKey={metric} />
      </div>
    </div>
  );
}
