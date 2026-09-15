import { describe, expect, it } from "vitest";
import { fallbackMapPoints } from "@/src/lib/data";
import {
  escapeHtml,
  metricExtent,
  metricValueColor,
  selectDisplayMeasurement,
} from "@/src/lib/map-utils";

describe("map presentation utilities", () => {
  it("calculates the observed extent without inventing missing values", () => {
    expect(metricExtent(fallbackMapPoints, "ph")).toEqual([7.3, 7.8]);
  });

  it("uses the midpoint color when every observed value is equal", () => {
    expect(metricValueColor("temperature", 20, [20, 20])).toBe("#f27663");
  });

  it("selects the newest series deterministically", () => {
    const point = {
      ...fallbackMapPoints[0],
      measurements: [
        { ...fallbackMapPoints[0].measurements[0], seriesId: "b", time: "2026-09-15T10:00:00Z" },
        { ...fallbackMapPoints[0].measurements[0], seriesId: "a", time: "2026-09-15T10:00:00Z" },
      ],
    };
    expect(selectDisplayMeasurement(point, "temperature")?.seriesId).toBe("a");
  });

  it("escapes provider-controlled tooltip text", () => {
    expect(escapeHtml("<img src=x onerror='bad'>")).toBe("&lt;img src=x onerror=&#39;bad&#39;&gt;");
  });
});
