import type { MapPoint } from "@/src/lib/data";

export type EcosystemKey = "open-bay" | "estuary" | "shallow-flats" | "tidal-marsh";

export type BayRegion = {
  id: string;
  label: string;
  labelPosition: [number, number];
  description: string;
  ecosystem: EcosystemKey;
  polygon: [number, number][];
};

export const ecosystems: Record<EcosystemKey, { label: string; icon: string; color: string; description: string }> = {
  "open-bay": { label: "Open bay", icon: "🌊", color: "#3689a8", description: "Wide water where currents, fish, and birds move through." },
  estuary: { label: "Estuary", icon: "🐦", color: "#8c72c9", description: "A meeting place where fresh water and salty water mix." },
  "shallow-flats": { label: "Shallow flats", icon: "🦀", color: "#d59a45", description: "Shallow, sunny water and mud where small creatures feed." },
  "tidal-marsh": { label: "Tidal marsh", icon: "🌾", color: "#4c9b78", description: "Tidal plants and creeks that give young fish places to hide." },
};

export const majorCities = [
  { name: "San Francisco", position: [37.7749, -122.4194] as [number, number] },
  { name: "Oakland", position: [37.8044, -122.2711] as [number, number] },
  { name: "Berkeley", position: [37.8716, -122.2727] as [number, number] },
  { name: "Richmond", position: [37.9358, -122.3477] as [number, number] },
  { name: "San Jose", position: [37.3382, -121.8863] as [number, number] },
  { name: "Vallejo", position: [38.1041, -122.2566] as [number, number] },
];

export const regions: BayRegion[] = [
  { id: "san-pablo", label: "San Pablo Bay", labelPosition: [38.13, -122.36], description: "Northern open water and the Richmond–San Rafael reach.", ecosystem: "open-bay", polygon: [[38.27, -122.52], [38.22, -122.42], [38.17, -122.30], [38.10, -122.18], [38.03, -122.17], [37.98, -122.27], [37.99, -122.38], [38.06, -122.49], [38.16, -122.55], [38.23, -122.55]] },
  { id: "suisun", label: "Suisun Bay & Delta edge", labelPosition: [38.11, -121.96], description: "The eastern transition where Bay water meets the Sacramento–San Joaquin Delta.", ecosystem: "estuary", polygon: [[38.17, -122.13], [38.26, -121.98], [38.24, -121.80], [38.14, -121.72], [38.04, -121.79], [37.97, -121.91], [37.98, -122.05], [38.05, -122.12]] },
  { id: "central-bay", label: "Central Bay", labelPosition: [37.86, -122.35], description: "The Golden Gate, the Bay Bridge corridor, and the central basin.", ecosystem: "open-bay", polygon: [[37.99, -122.40], [37.94, -122.34], [37.88, -122.28], [37.82, -122.23], [37.76, -122.25], [37.71, -122.31], [37.74, -122.39], [37.81, -122.45], [37.90, -122.45], [37.96, -122.44]] },
  { id: "south-bay", label: "South Bay", labelPosition: [37.56, -122.27], description: "The broad southern basin from San Mateo toward the Dumbarton reach.", ecosystem: "shallow-flats", polygon: [[37.70, -122.30], [37.71, -122.21], [37.65, -122.15], [37.57, -122.13], [37.48, -122.17], [37.41, -122.27], [37.40, -122.36], [37.48, -122.41], [37.58, -122.40], [37.66, -122.36]] },
  { id: "alviso", label: "Alviso & South Bay tributaries", labelPosition: [37.46, -122.03], description: "The shallow southern edge and connected tributary corridors.", ecosystem: "tidal-marsh", polygon: [[37.56, -122.11], [37.63, -122.05], [37.60, -121.97], [37.52, -121.93], [37.43, -121.85], [37.35, -121.87], [37.31, -122.00], [37.35, -122.13], [37.43, -122.18], [37.51, -122.16]] },
];

export function pointInPolygon(lat: number, lng: number, polygon: [number, number][]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const [currentLat, currentLng] = polygon[index];
    const [previousLat, previousLng] = polygon[previous];
    const crossesLatitude = (currentLat > lat) !== (previousLat > lat);
    const longitudeAtLatitude = ((previousLng - currentLng) * (lat - currentLat)) / (previousLat - currentLat) + currentLng;
    if (crossesLatitude && lng < longitudeAtLatitude) inside = !inside;
  }
  return inside;
}

export function regionForPoint(point: Pick<MapPoint, "lat" | "lng">) {
  const polygonRegion = regions.find((region) => pointInPolygon(point.lat, point.lng, region.polygon));
  if (polygonRegion) return polygonRegion.id;
  if (point.lat >= 38.02 && point.lng < -122.18) return "san-pablo";
  if (point.lat >= 37.95) return "suisun";
  if (point.lat >= 37.75) return "central-bay";
  if (point.lng > -122.1) return "alviso";
  return "south-bay";
}

export function ecosystemForRegionId(regionId: string): EcosystemKey {
  return regions.find((region) => region.id === regionId)?.ecosystem ?? "open-bay";
}
