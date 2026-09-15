import { metricDefinitions } from "@/src/lib/data";
import type { MapMeasurement, MapPoint, MetricKey } from "@/src/lib/data";
import type { BayRegion } from "@/src/lib/regions";
import { regionForPoint } from "@/src/lib/regions";

export function getMeasurements(point: MapPoint, key: MetricKey) {
  return point.measurements.filter((measurement) => measurement.key === key && measurement.value !== null);
}

export function getSeries(point: MapPoint, key: MetricKey) {
  return point.measurements.filter((measurement) => measurement.key === key);
}

export function selectDisplayMeasurement(point: MapPoint, key: MetricKey) {
  return [...getMeasurements(point, key)].sort((a, b) => {
    const timeDifference = new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime();
    return timeDifference || a.seriesId.localeCompare(b.seriesId);
  })[0];
}

export function formatValue(measurement: MapMeasurement | undefined) {
  if (!measurement || measurement.value === null) return "—";
  return `${measurement.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${measurement.unit}`;
}

export function freshnessLabel(freshness: MapMeasurement["freshness"] | undefined) {
  if (freshness === "recent") return "Recent source value";
  if (freshness === "older") return "Older source value";
  if (freshness === "archive") return "Archive value";
  return "No value for this metric";
}

export function metricExtent(points: MapPoint[], key: MetricKey): [number, number] | null {
  const values = points.flatMap((point) => getMeasurements(point, key)).map((measurement) => measurement.value as number);
  return values.length ? [Math.min(...values), Math.max(...values)] : null;
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return { r: value >> 16, g: (value >> 8) & 255, b: value & 255 };
}

function mixHex(start: string, end: string, amount: number) {
  const a = hexToRgb(start);
  const b = hexToRgb(end);
  const channel = (from: number, to: number) => Math.round(from + (to - from) * amount).toString(16).padStart(2, "0");
  return `#${channel(a.r, b.r)}${channel(a.g, b.g)}${channel(a.b, b.b)}`;
}

export function metricValueColor(key: MetricKey, value: number | null | undefined, extent: [number, number] | null) {
  if (value === null || value === undefined || !Number.isFinite(value) || !extent) return "#829590";
  const [minimum, maximum] = extent;
  const normalized = maximum === minimum ? 0.5 : Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum)));
  const colors = metricDefinitions[key].colors;
  return normalized <= 0.5
    ? mixHex(colors[0], colors[1], normalized * 2)
    : mixHex(colors[1], colors[2], (normalized - 0.5) * 2);
}

export function regionSummary(region: BayRegion, points: MapPoint[], metric: MetricKey) {
  const regionalPoints = points.filter((point) => regionForPoint(point) === region.id);
  const measurements = regionalPoints.flatMap((point) => getMeasurements(point, metric));
  const coveredPoints = regionalPoints.filter((point) => getMeasurements(point, metric).length > 0).length;
  const units = [...new Set(measurements.map((measurement) => measurement.unit))];
  const values = measurements.map((measurement) => measurement.value as number).sort((a, b) => a - b);
  const latest = [...measurements].sort((a, b) => new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime())[0];
  const valueSpan = units.length > 1
    ? `${measurements.length} series with mixed units`
    : values.length > 1
      ? `${values[0].toLocaleString(undefined, { maximumFractionDigits: 2 })}–${values.at(-1)?.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${units[0] ?? ""}`
      : values.length === 1
        ? formatValue(measurements[0])
        : "No value in this region";
  return { region, points: regionalPoints, measurements, coveredPoints, seriesCount: measurements.length, valueSpan, latest };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}
