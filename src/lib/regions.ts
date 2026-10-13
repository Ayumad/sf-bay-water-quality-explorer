import type { MapPoint } from "@/src/lib/data";

export type BayRegion = {
  id: string;
  label: string;
  labelPosition: [number, number];
  description: string;
};

export const habitatCategories = [
  {
    key: "deep-subtidal",
    label: "Deep subtidal",
    color: "#6677cd",
    description: "Deeper continuously submerged Bay water.",
  },
  {
    key: "shallow-subtidal",
    label: "Shallow subtidal",
    color: "#b5d3e8",
    description: "Shallow continuously submerged Bay water.",
  },
  {
    key: "tidal-flat",
    label: "Tidal flat",
    color: "#ad925c",
    description: "Intertidal sediment exposed and covered by the tide.",
  },
  {
    key: "tidal-marsh",
    label: "Tidal marsh",
    color: "#73b273",
    description: "Vegetated marsh connected to tidal water.",
  },
  {
    key: "other-marsh",
    label: "Other or managed marsh",
    color: "#89cd66",
    description: "Mapped managed, muted, or other marsh habitat.",
  },
  {
    key: "tidal-channel",
    label: "Intertidal channel",
    color: "#002673",
    description: "Channels carrying tidal water through baylands.",
  },
  {
    key: "pond-panne",
    label: "Tidal pond or panne",
    color: "#dbc69c",
    description: "Ponds and pannes within tidal areas.",
  },
  {
    key: "managed-water",
    label: "Other open water",
    color: "#beffe8",
    description: "Managed, muted, salt-pond, or treatment-water areas.",
  },
  {
    key: "diked-bayland",
    label: "Diked bayland",
    color: "#c29ed7",
    description: "Former or potential bayland behind levees.",
  },
] as const;

export const regions: BayRegion[] = [
  {
    id: "suisun",
    label: "Suisun Bay",
    labelPosition: [38.09, -121.98],
    description: "The eastern estuary between the Delta and Carquinez Strait.",
  },
  {
    id: "carquinez",
    label: "Carquinez Strait",
    labelPosition: [38.05, -122.2],
    description:
      "The narrow tidal strait connecting Suisun and San Pablo Bays.",
  },
  {
    id: "san-pablo",
    label: "San Pablo Bay",
    labelPosition: [38.12, -122.36],
    description:
      "The broad northern Bay between Carquinez Strait and the central estuary.",
  },
  {
    id: "central-bay",
    label: "Central Bay",
    labelPosition: [37.84, -122.35],
    description: "The Golden Gate, Bay Bridge corridor, and central basin.",
  },
  {
    id: "south-bay",
    label: "South Bay",
    labelPosition: [37.61, -122.24],
    description:
      "The basin south of the Bay Bridge toward the Dumbarton reach.",
  },
  {
    id: "lower-south-bay",
    label: "Lower South Bay",
    labelPosition: [37.43, -122.02],
    description: "The shallow southernmost Bay and Alviso-area tidal habitats.",
  },
];

export const majorCities = [
  { name: "San Francisco", position: [37.7749, -122.4194] as [number, number] },
  { name: "Oakland", position: [37.8044, -122.2711] as [number, number] },
  { name: "Berkeley", position: [37.8716, -122.2727] as [number, number] },
  { name: "Richmond", position: [37.9358, -122.3477] as [number, number] },
  { name: "San Jose", position: [37.3382, -121.8863] as [number, number] },
  { name: "Vallejo", position: [38.1041, -122.2566] as [number, number] },
];

// These groupings organize station lists; no boundary polygons are inferred or displayed.
const regionByStationId: Record<string, string> = {
  "USGS-11162765": "south-bay",
  "USGS-11176900": "south-bay",
  "USGS-11172175": "lower-south-bay",
  "USGS-11455780": "suisun",
  "USGS-11455820": "carquinez",
  "USGS-380807122034701": "suisun",
  "USGS-381126121554801": "suisun",
  "USGS-381142122015801": "suisun",
  "USGS-11162690": "central-bay",
};

export function regionForPoint(point: Pick<MapPoint, "id" | "lat" | "lng">) {
  const reviewedRegion = regionByStationId[point.id];
  if (reviewedRegion) return reviewedRegion;
  if (point.lat >= 38.0 && point.lng > -122.02) return "suisun";
  if (point.lat >= 37.96 && point.lng > -122.27 && point.lng <= -122.02)
    return "carquinez";
  if (point.lat >= 37.93) return "san-pablo";
  if (point.lat >= 37.7) return "central-bay";
  if (point.lat >= 37.48) return "south-bay";
  return "lower-south-bay";
}
