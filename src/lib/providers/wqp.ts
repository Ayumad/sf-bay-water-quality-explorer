/**
 * Water Quality Portal boundary for historical/discrete context.
 * WQP is intentionally separate from continuous USGS values because the
 * records have different cadence, methods, qualifiers, and freshness semantics.
 */
export const WQP_RESULT_SEARCH = "https://www.waterqualitydata.us/wqx3/Result/search";

export function buildWqpResultUrl(bbox: string) {
  const coordinates = bbox.split(",").map((value) => Number(value.trim()));
  if (
    coordinates.length !== 4
    || coordinates.some((value) => !Number.isFinite(value))
    || coordinates[0] >= coordinates[2]
    || coordinates[1] >= coordinates[3]
    || coordinates[0] < -180
    || coordinates[2] > 180
    || coordinates[1] < -90
    || coordinates[3] > 90
  ) {
    throw new Error("WQP bounding box must be west,south,east,north within valid coordinate ranges");
  }
  const params = new URLSearchParams();
  params.set("bBox", coordinates.join(","));
  params.set("mimeType", "json");
  params.set("dataProfile", "narrow");
  params.append("providers", "NWIS");
  params.append("providers", "STORET");
  return `${WQP_RESULT_SEARCH}?${params.toString()}`;
}
