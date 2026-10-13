import { getStation } from "@/src/lib/data";

export type ConservationStatus = {
  label: string;
  rank: string | null;
  isAtRisk: boolean;
  sourceUrl: string;
  matchedName: string;
  retrievedAt: string;
};
export type SpeciesObservation = {
  taxonId: number;
  commonName: string;
  scientificName: string;
  group: string;
  observedOn: string;
  sourceUrl: string;
  imageUrl: string | null;
  attribution: string | null;
  imageKind: "observation" | "species-reference" | null;
  imageSourceUrl: string | null;
  license: string | null;
  status: ConservationStatus | null;
};
export type WildlifeResult = {
  station: string;
  data: SpeciesObservation[];
  isFallback: boolean;
  retrievedAt: string;
  fromDate: string;
  radiusKm: number;
  message: string;
  statusAvailable: boolean;
};
type RecordValue = Record<string, unknown>;
function record(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
function safeUrl(value: unknown, hosts: string[]): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && hosts.includes(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function reusablePhoto(value: unknown) {
  if (!record(value)) return null;
  const license = text(value.license_code)?.toLowerCase();
  if (!license || !["cc0", "cc-by", "cc-by-sa"].includes(license)) return null;
  const url = safeUrl(value.medium_url ?? value.url, [
    "static.inaturalist.org",
    "inaturalist-open-data.s3.amazonaws.com",
  ]);
  const attribution = text(value.attribution);
  if (
    !url ||
    !attribution ||
    (Array.isArray(value.flags) && value.flags.length)
  )
    return null;
  // iNaturalist supplies medium URLs for taxon photos; observation photos often
  // expose only square URLs. The size variant retains the same photo identity.
  const imageUrl = url.replace(/\/square\.(jpe?g|png)(?=\?|$)/i, "/medium.$1");
  const id =
    typeof value.id === "number" && Number.isInteger(value.id) && value.id > 0
      ? value.id
      : null;
  return {
    imageUrl,
    attribution,
    license,
    imageSourceUrl: id ? `https://www.inaturalist.org/photos/${id}` : url,
  };
}

export function attachSpeciesPhotos(
  data: SpeciesObservation[],
  payload: unknown,
) {
  if (!record(payload) || !Array.isArray(payload.results)) return;
  for (const observation of data) {
    if (observation.imageUrl) continue;
    const matches = payload.results.filter(
      (taxon) =>
        record(taxon) &&
        taxon.id === observation.taxonId &&
        text(taxon.name)?.toLowerCase() ===
          observation.scientificName.toLowerCase(),
    );
    if (matches.length !== 1 || !record(matches[0])) continue;
    const taxon = matches[0];
    const candidates = Array.isArray(taxon.taxon_photos)
      ? taxon.taxon_photos.flatMap((item) => (record(item) ? [item.photo] : []))
      : [];
    const photo = [...candidates, taxon.default_photo]
      .map(reusablePhoto)
      .find(Boolean);
    if (photo)
      Object.assign(observation, photo, { imageKind: "species-reference" });
  }
}

export function parseObservations(payload: unknown): SpeciesObservation[] {
  if (!record(payload) || !Array.isArray(payload.results))
    throw new Error("Invalid observation response");
  const seen = new Set<number>();
  return payload.results
    .flatMap((row): SpeciesObservation[] => {
      if (
        !record(row) ||
        !record(row.taxon) ||
        typeof row.taxon.id !== "number" ||
        seen.has(row.taxon.id)
      )
        return [];
      const scientificName = text(row.taxon.name),
        observedOn = text(row.observed_on);
      if (
        !scientificName ||
        !observedOn ||
        !Number.isFinite(Date.parse(observedOn)) ||
        typeof row.id !== "number"
      )
        return [];
      seen.add(row.taxon.id);
      const photo = (Array.isArray(row.photos) ? row.photos : [])
        .map(reusablePhoto)
        .find(Boolean);
      return [
        {
          taxonId: row.taxon.id,
          scientificName,
          commonName: text(row.taxon.preferred_common_name) ?? scientificName,
          group: text(row.taxon.iconic_taxon_name) ?? "Organism",
          observedOn,
          sourceUrl: `https://www.inaturalist.org/observations/${row.id}`,
          imageUrl: photo?.imageUrl ?? null,
          attribution: photo?.attribution ?? null,
          license: photo?.license ?? null,
          imageKind: photo ? "observation" : null,
          imageSourceUrl: photo?.imageSourceUrl ?? null,
          status: null,
        },
      ];
    })
    .slice(0, 6);
}

export function matchConservation(
  payload: unknown,
  scientificName: string,
): ConservationStatus | null {
  if (!record(payload) || !Array.isArray(payload.results)) return null;
  const matches = payload.results.filter(
    (row) =>
      record(row) &&
      text(row.scientificName)?.toLowerCase() === scientificName.toLowerCase(),
  );
  if (matches.length !== 1 || !record(matches[0])) return null;
  const row = matches[0];
  const rank = text(row.roundedGRank);
  const federal = record(row.speciesGlobal)
    ? text(row.speciesGlobal.usesaCode)
    : null;
  const labels: Record<string, string> = {
    G1: "Critically imperiled",
    G2: "Imperiled",
    G3: "Vulnerable",
    G4: "Apparently secure",
    G5: "Secure",
    GH: "Possibly extinct",
    GX: "Presumed extinct",
  };
  const label =
    federal === "LE"
      ? "Federally endangered"
      : federal === "LT"
        ? "Federally threatened"
        : rank && labels[rank]
          ? `${labels[rank]} · global rank`
          : null;
  const uniqueId = text(row.uniqueId);
  if (!label || !uniqueId || !/^ELEMENT_GLOBAL\.\d+\.\d+$/.test(uniqueId))
    return null;
  return {
    label,
    rank,
    isAtRisk:
      federal === "LE" ||
      federal === "LT" ||
      Boolean(rank && ["G1", "G2", "G3", "GH", "GX"].includes(rank)),
    sourceUrl: `https://explorer.natureserve.org/Taxon/${uniqueId}`,
    matchedName: scientificName,
    retrievedAt: new Date().toISOString(),
  };
}

const cache = new Map<string, WildlifeResult>();
const inFlight = new Map<string, Promise<WildlifeResult>>();
export async function loadWildlife(
  slug: string,
  options: {
    fetchImplementation?: typeof fetch;
    now?: Date;
    useCache?: boolean;
  } = {},
): Promise<WildlifeResult> {
  const station = getStation(slug);
  if (!station) throw new Error("Unknown station");
  const now = options.now ?? new Date(),
    fetcher = options.fetchImplementation ?? fetch;
  const from = new Date(now);
  from.setUTCFullYear(from.getUTCFullYear() - 1);
  const useCache = options.useCache ?? !options.fetchImplementation;
  const saved = useCache ? cache.get(slug) : undefined;
  if (saved && now.getTime() - Date.parse(saved.retrievedAt) < 600_000)
    return saved;
  if (useCache && inFlight.has(slug)) return inFlight.get(slug)!;
  const run = async (): Promise<WildlifeResult> => {
    const base = {
      station: slug,
      retrievedAt: now.toISOString(),
      fromDate: from.toISOString().slice(0, 10),
      radiusKm: 5,
    };
    try {
      const url = new URL("https://api.inaturalist.org/v1/observations");
      Object.entries({
        lat: String(station.coordinates.lat),
        lng: String(station.coordinates.lng),
        radius: "5",
        d1: base.fromDate,
        d2: now.toISOString().slice(0, 10),
        per_page: "50",
        quality_grade: "research",
        order_by: "observed_on",
        order: "desc",
        captive: "false",
      }).forEach(([key, value]) => url.searchParams.set(key, value));
      const response = await fetcher(url, {
        signal: AbortSignal.timeout(5_000),
        headers: { Accept: "application/json" },
        redirect: "error",
      });
      if (!response.ok) throw new Error("Observation provider unavailable");
      const data = parseObservations(await response.json());
      // One bounded lookup for missing species imagery, not one request per card.
      const missingPhotos = data.filter((item) => !item.imageUrl);
      const photoLookup = missingPhotos.length
        ? (async () => {
            try {
              const ids = missingPhotos.map((item) => item.taxonId).join(",");
              const response = await fetcher(
                `https://api.inaturalist.org/v1/taxa/${ids}`,
                {
                  signal: AbortSignal.timeout(5_000),
                  headers: { Accept: "application/json" },
                  redirect: "error",
                },
              );
              if (response.ok) attachSpeciesPhotos(data, await response.json());
            } catch {
              /* Photo availability never removes a dated observation. */
            }
          })()
        : Promise.resolve();
      // Independent, bounded requests use exact scientific names, never shared numeric IDs/common names.
      const statusSignal = AbortSignal.timeout(5_000);
      await Promise.all(
        data.map(async (observation) => {
          try {
            const response = await fetcher(
              "https://explorer.natureserve.org/api/data/speciesSearch",
              {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                },
                redirect: "error",
                signal: statusSignal,
                body: JSON.stringify({
                  criteriaType: "species",
                  textCriteria: [
                    {
                      paramType: "textSearch",
                      searchToken: observation.scientificName,
                      matchAgainst: "scientificName",
                      operator: "equals",
                    },
                  ],
                  pagingOptions: { page: 0, recordsPerPage: 5 },
                }),
              },
            );
            if (response.ok)
              observation.status = matchConservation(
                await response.json(),
                observation.scientificName,
              );
          } catch {
            /* An unknown status never removes an observation. */
          }
        }),
      );
      await photoLookup;
      const result: WildlifeResult = {
        ...base,
        data,
        isFallback: false,
        statusAvailable: data.some((item) => item.status !== null),
        message: data.length
          ? "Research-grade community observations within 5 km, over the previous year. Observations are not a census."
          : "No observations were returned for this area and time window. This does not mean wildlife is absent.",
      };
      if (useCache) cache.set(slug, result);
      return result;
    } catch {
      if (process.env.NODE_ENV !== "test")
        console.warn(
          JSON.stringify({
            module: "M3",
            provider: "iNaturalist",
            event: "provider_unavailable",
            fallback: Boolean(saved),
          }),
        );
      return saved
        ? {
            ...saved,
            isFallback: true,
            message:
              "The wildlife provider is unavailable. Showing saved observations with their original dates.",
          }
        : {
            ...base,
            data: [],
            isFallback: true,
            statusAvailable: false,
            message:
              "Wildlife observations are temporarily unavailable. Water measurements and learning guides remain available.",
          };
    }
  };
  if (!useCache) return run();
  const promise = run();
  inFlight.set(slug, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(slug);
  }
}
