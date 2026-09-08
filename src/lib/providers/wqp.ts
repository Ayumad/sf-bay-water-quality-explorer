/**
 * Water Quality Portal boundary for historical/discrete context.
 * WQP is intentionally separate from continuous USGS values because the
 * records have different cadence, methods, qualifiers, and freshness semantics.
 */
export const WQP_RESULT_SEARCH = "https://www.waterqualitydata.us/wqx3/Result/search";

export function buildWqpResultUrl(bbox: string) {
  const params = new URLSearchParams();
  params.set("bBox", bbox);
  params.set("mimeType", "json");
  params.set("dataProfile", "narrow");
  params.append("providers", "NWIS");
  params.append("providers", "STORET");
  return `${WQP_RESULT_SEARCH}?${params.toString()}`;
}
