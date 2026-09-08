/**
 * NOAA CO-OPS complements USGS with water temperature, conductivity, salinity,
 * tides, and currents at coastal stations. It should be joined by station and
 * timestamp, never blended into a single unlabeled reading.
 */
export const NOAA_COOPS_DATA_API = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
export const NOAA_COOPS_METADATA_API = "https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi";

export function buildNoaaWaterTemperatureUrl(station: string) {
  const params = new URLSearchParams({
    date: "today",
    station,
    product: "water_temperature",
    time_zone: "gmt",
    units: "metric",
    format: "json",
    application: "Baywatcher",
  });
  return `${NOAA_COOPS_DATA_API}?${params.toString()}`;
}
