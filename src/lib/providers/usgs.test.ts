import { describe, expect, it } from "vitest";
import { publicStationName } from "@/src/lib/data";
import {
  assertUsgsHost,
  buildUsgsMapPoints,
  measurementFreshness,
  normalizeUsgsUnit,
  normalizeUsgsValue,
} from "@/src/lib/providers/usgs";

const latest = {
  features: [
    {
      geometry: { coordinates: [-122.25, 37.58] },
      properties: {
        time_series_id: "upper-temperature",
        monitoring_location_id: "USGS-11162765",
        parameter_code: "00010",
        statistic_id: "00011",
        time: "2026-09-15T16:45:00Z",
        value: "21.3",
        unit_of_measure: "degC",
        approval_status: "Provisional",
        qualifier: null,
      },
    },
    {
      geometry: { coordinates: [-122.25, 37.58] },
      properties: {
        time_series_id: "lower-temperature",
        monitoring_location_id: "USGS-11162765",
        parameter_code: "00010",
        statistic_id: "00011",
        time: "2026-09-15T16:45:00Z",
        value: "20.8",
        unit_of_measure: "degC",
        approval_status: "Provisional",
        qualifier: ["EQUIP"],
      },
    },
    {
      geometry: { coordinates: [-120, 38] },
      properties: {
        time_series_id: "outside-allowlist",
        monitoring_location_id: "USGS-00000000",
        parameter_code: "00010",
        time: "2026-09-15T16:45:00Z",
        value: "99",
        unit_of_measure: "degC",
      },
    },
  ],
};

const locations = {
  features: [
    {
      id: "USGS-11162765",
      geometry: { coordinates: [-122.2508, 37.5844] },
      properties: {
        monitoring_location_name: "San Mateo Bridge",
        site_type: "Estuary",
      },
    },
  ],
};

const series = {
  features: [
    {
      id: "upper-temperature",
      properties: {
        monitoring_location_id: "USGS-11162765",
        sublocation_identifier: "UPPER - 44 FT FROM BED",
        web_description: "YSI EXO",
      },
    },
    {
      id: "lower-temperature",
      properties: {
        monitoring_location_id: "USGS-11162765",
        sublocation_identifier: "LOWER - 10 FT FROM BED",
        web_description: "YSI EXO",
      },
    },
  ],
};

describe("USGS normalization", () => {
  it("preserves separate time series and their depth metadata", () => {
    const points = buildUsgsMapPoints(latest, locations, series, {
      now: new Date("2026-09-15T17:00:00Z"),
    });
    expect(points).toHaveLength(1);
    expect(points[0].name).toBe("San Mateo Bridge");
    expect(points[0].measurements).toHaveLength(2);
    expect(
      points[0].measurements.map((measurement) => measurement.seriesId),
    ).toEqual(["lower-temperature", "upper-temperature"]);
    expect(
      points[0].measurements.map((measurement) => measurement.depth),
    ).toEqual(["LOWER - 10 FT FROM BED", "UPPER - 44 FT FROM BED"]);
    expect(points[0].measurements[0].qualifiers).toEqual(["EQUIP"]);
  });

  it("normalizes only finite numbers and known source units", () => {
    expect(normalizeUsgsValue(" 12.5 ")).toBe(12.5);
    expect(normalizeUsgsValue("not-a-number")).toBeNull();
    expect(normalizeUsgsValue(" ")).toBeNull();
    expect(normalizeUsgsValue("0")).toBe(0);
    expect(normalizeUsgsUnit("_FNU")).toBe("FNU");
    expect(normalizeUsgsUnit("uS/cm")).toBe("µS/cm");
  });

  it("separates freshness from fetch health", () => {
    const now = new Date("2026-09-15T00:00:00Z");
    expect(measurementFreshness("2026-09-14T00:00:00Z", now)).toBe("recent");
    expect(measurementFreshness("2026-08-01T00:00:00Z", now)).toBe("older");
    expect(measurementFreshness("2025-01-01T00:00:00Z", now)).toBe("archive");
    expect(measurementFreshness("invalid", now)).toBe("unavailable");
  });

  it("rejects non-USGS and non-HTTPS upstream hosts", () => {
    expect(() =>
      assertUsgsHost("https://api.waterdata.usgs.gov/ogcapi/v0"),
    ).not.toThrow();
    expect(() => assertUsgsHost("https://example.com/ogcapi/v0")).toThrow(
      /allowlist/,
    );
    expect(() =>
      assertUsgsHost("http://api.waterdata.usgs.gov/ogcapi/v0"),
    ).toThrow(/allowlist/);
  });

  it("replaces provider identifiers with reviewed public names", () => {
    expect(publicStationName("USGS-11162765", "11162765")).toBe(
      "San Mateo Bridge",
    );
    expect(publicStationName("USGS-999", "999")).toBe(
      "Unnamed USGS monitoring location",
    );
    expect(publicStationName("USGS-999", "  Plain Creek   at Town  ")).toBe(
      "Plain Creek at Town",
    );
  });

  it("omits stations whose source contains no usable measurement", () => {
    const emptyLatest = {
      features: [
        {
          geometry: { coordinates: [-122.45, 37.8] },
          properties: {
            time_series_id: "empty-series",
            monitoring_location_id: "USGS-11162690",
            parameter_code: "00010",
            time: "2026-09-15T16:45:00Z",
            value: null,
            unit_of_measure: "degC",
          },
        },
      ],
    };
    expect(
      buildUsgsMapPoints(
        emptyLatest,
        { features: [] },
        { features: [] },
        { stationAllowlist: ["USGS-11162690"] },
      ),
    ).toEqual([]);
  });
});
