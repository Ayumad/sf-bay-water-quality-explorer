# Baywatcher · SF Bay Water Quality Explorer

Baywatcher is an account-free educational dashboard for understanding water-quality data around San Francisco Bay. The homepage is a map-first explorer: navigate a calm, simplified basemap, hover or select a body-of-water region, switch between water-quality and habitat views, and read the source-point values represented by that region in context. Source, unit, collection time, method, depth, qualifier, and freshness all matter.

The deployed preview is intentionally review-gated. It shows the complete product shape, but it does not claim live measurement values until the exact USGS series mappings have been validated. That choice is part of the product, not a temporary cosmetic limitation: the production plan explicitly rejects fabricated measurements and neighboring-station substitution.

## Quick start

Requirements:

- Node.js 20+ (the development environment currently uses Node 24).
- pnpm 9+.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
pnpm typecheck
pnpm build
pnpm start
```

`pnpm lint` is retained as a script placeholder for teams that add the preferred Next.js lint integration; typechecking and the production build are the required checks in this starter.

## What is in the first release

- A responsive, map-first bay explorer with metric-specific color lenses for temperature, dissolved oxygen, pH, turbidity, and conductivity.
- A calm, no-label gray base map with only major-city labels, built for quick orientation instead of road-by-road navigation.
- A kid-friendly habitat view that segments the Bay into open bay, estuary, shallow flats, and tidal marsh regions with simple icons and plain-language descriptions.
- Navigable Esri World Light Gray/Leaflet geography with selectable San Pablo Bay, Suisun Bay, Central Bay, South Bay, and Alviso/tributary regions.
- Hoverable region polygons and keyboard-accessible region chips with a detail rail showing source-point coverage, observed spans, timestamps, freshness, and provenance.
- A bounded live USGS source query with a dated captured fallback snapshot when local/deployed outbound access is unavailable.
- A station profile with four metric cards and explicit unavailable states.
- Educational explanations for temperature, dissolved oxygen, pH, and turbidity.
- Provenance affordances: provider ID, station source link, review date, and state.
- Wildlife and conservation-context panels with reviewed-import-pending states.
- A methods page that documents interpretation, freshness, source separation, accessibility, and launch gates.
- Read-only API contracts for allowlisted stations, bounded station measurements, and health.
- Provider boundaries in `src/lib/providers/usgs.ts`, `src/lib/providers/wqp.ts`, and `src/lib/providers/noaa.ts` for future validation and normalization.
- A visual language built from CSS: deep estuary navy, water-aqua surfaces, warm caution accents, generous whitespace, and strong type hierarchy.

## Product decisions

### Audience and promise

The audience is a curious member of the public, student, educator, or community partner—not an operator making an immediate health decision. The promise is “help me understand what this number means.” The interface therefore avoids a single water-quality score, red/green safety colors, and unexplained threshold judgments.

The site is educational. It is not a swimming, drinking, fishing, pet, or public-health advisory. That limitation is repeated at the station level because context belongs next to the measurement, not only in a footer.

### Map first, with a region summary and source-point alternative

The homepage opens directly on a real, navigable Leaflet map using a simplified Esri World Light Gray base layer with visible attribution. Only major cities are added as labels by the app; the base layer intentionally keeps roads and minor place names quiet. The map is organized into broad body-of-water regions rather than implying that one sensor represents an entire basin. Region overlays support hover and click selection; the region chips provide a keyboard-friendly equivalent. The detail rail reports how many source points have the selected metric, the observed span without averaging unlike sensors or depths, the freshest timestamp, and every source point included in that region.

The habitat toggle is a broad learning layer, not a biodiversity inventory. It uses stable, classroom-friendly ecosystem categories so a young learner can ask “what kind of place is this?” without confusing an illustrated habitat context with a claim that a particular species was observed there today. Live species observations remain a separate future data product with its own provenance and licensing review.

The map uses a bounded USGS query rather than a user-supplied URL: `latest-continuous/items` provides recent continuous observations and `monitoring-locations/items` supplies names/types/coordinates. The route aggregates duplicate records by station and parameter, selecting the newest timestamp, preserves source units/qualifiers/approval status, and returns a short public cache. A production ingestion layer should eventually publish from PostgreSQL rather than making the map dependent on an external request at page load.

If the live feed fails, the route returns an explicitly dated source snapshot captured from the official endpoint. The map displays “Source degraded” and the detail rail labels those values as older; no empty value is filled with a neighbor or a synthetic number.

### Color system and AQI-like scanning

Each metric gets a distinct hue because the metrics do not share a common unit or interpretation:

| Lens | Hue | Meaning of the color |
| --- | --- | --- |
| Temperature | coral | This is the temperature lens, not a heat/safety judgment. |
| Dissolved oxygen | blue | This is the oxygen lens; concentration stays separate from saturation. |
| pH | violet | This is the acidity/alkalinity lens; pH has no concentration unit. |
| Turbidity | amber | This is the cloudiness lens; NTU/FNU method distinctions remain visible. |
| Conductivity | green | This is the dissolved-ion/conductance lens, not a synonym for salinity. |

The small lower/mid/higher color key is a visual scanning aid only. It is not a composite water-health score, regulatory threshold, or swimming/drinking/fishing/pet-safety advisory. The exact source value, unit, timestamp, freshness state, qualifier, and source link remain the authoritative interface.

### Preview mode and truthful absence

The candidate station `USGS-11162765` comes from the production plan and is linked to its official station page. It is not described as having verified temperature, dissolved oxygen, pH, or turbidity coverage here. Each card says that mapping is awaiting verification.

This avoids three common data errors:

1. Treating a station’s existence as proof that the desired metrics are present.
2. Combining different sensors or depths into one unlabeled value.
3. Turning a missing value into zero, “safe,” “absent,” or a neighboring station’s result.

## Information architecture

| Route | Responsibility |
| --- | --- |
| `/` | Map-first Bay explorer, water-quality metric lenses, habitat regions, hover/focus region summaries, source-point details, source coverage cards, metric explanations |
| `/stations/[slug]` | Station identity, snapshot cards, provenance, species/status empty states, limitations |
| `/about/data` | Source strategy, metric rules, freshness policy, wildlife/status approach, accessibility and launch gates |
| `/api/stations` | Allowlisted station metadata |
| `/api/stations/[slug]/measurements` | Bounded station snapshot contract; no arbitrary station or source query |
| `/api/health` | Minimal health response without infrastructure details |
| `/api/map-points` | Bounded USGS latest-continuous + monitoring-location query with a dated fallback snapshot |
| `src/lib/providers/usgs.ts` | USGS-specific types and normalization boundary |
| `src/lib/providers/wqp.ts` | WQP historical/discrete result URL boundary |
| `src/lib/providers/noaa.ts` | NOAA CO-OPS complementary coastal product boundary |
| `src/lib/data.ts` | Current review-gated station registry and snapshot state |

Server-rendered pages call shared data directly. They do not make HTTP requests to the app’s own API. The API exists for external clients and future ingestion boundaries, not as an unnecessary internal hop.

## Data architecture decision record

### Primary source

Modern USGS water-data APIs are the planned primary source for continuous readings. The Water Quality Portal is a separate candidate for historical or discrete sample context, not an interchangeable live sensor source. Each provider gets its own adapter and schema validation.

Before enabling live data, create a coverage matrix with:

- exact station ID;
- exact series ID;
- parameter code;
- raw and canonical unit;
- method and depth;
- newest collection timestamp;
- reporting cadence;
- qualifiers and provisional state;
- query used and response capture date.

The initial candidate station is a starting point, not proof of four-metric coverage.

### Persistence

The production plan recommends managed PostgreSQL through Neon and a typed schema/migration layer such as Drizzle. The reason for a database is durable last-successful snapshots, ingestion bookkeeping, atomic publication, and reviewable history—not user accounts.

Git remains the authority for station configuration, reviewed explanations, and the small conservation crosswalk. The database owns fetched measurements and ingestion state. Do not create competing manual edits in both places.

### Measurement contract

Every normalized measurement should retain:

- provider result/series identity;
- internal metric;
- parsed value plus raw value;
- raw and canonical units;
- collection time and its precision;
- qualifier, provisional/estimated state;
- method/depth metadata;
- fetch time;
- source URL.

Use timezone-aware timestamps for instants. Keep date-only samples as dates; never manufacture midnight and imply an exact time.

Normalization rules are deliberately conservative:

- Temperature begins in Celsius, with the original unit preserved.
- Dissolved-oxygen concentration and percent saturation remain separate metrics.
- Turbidity method/unit variants such as NTU and FNU remain visible.
- pH does not get a concentration unit.
- Detection limits and inequalities remain qualifiers.
- Invalid provider values are quarantined or omitted with a reason.
- Multiple depths are labeled or documented as the primary series; they are never casually averaged.

### Freshness

Measurement age and importer health are separate facts. A healthy importer can fetch a source that has not published a new sample. Proposed defaults for a live release are:

- continuous series within expected cadence: “Latest available”;
- beyond the validated window: “Older reading”;
- more than 24 hours old: remove current-condition implication;
- discrete sample: “Sample collected on …”;
- provider failure with saved data: keep last valid record and show degradation;
- no saved value: show the specific unavailable state;
- successful empty result: retain old data with its actual age;
- withdrawn upstream record: exclude from latest selection but preserve provenance.

These are UI policy defaults, not scientific safety thresholds.

## Wildlife and conservation decisions

The recommended first wildlife release is a reviewed, bounded observation import rather than a live request on every page visit. The target product choice is 5 km around a station, previous 12 months, at most 20 distinct taxa, with observation link and date. Approximate or highly uncertain coordinates should not be reproduced as precise pins. A lack of observations is not evidence of absence.

Conservation status is a separate product. Start with a reviewed catalog using California CDFW and applicable federal authorities, preserving authority, jurisdiction, scientific name, scope, source URL, effective date when known, and review date. Common names do not join records. Unresolved identity stays visibly unknown.

## Reliability and security plan

The future scheduled importer should:

- run on a deliberate schedule, initially 15 minutes only if source cadence and budget justify it;
- authenticate the cron route with `Authorization: Bearer <CRON_SECRET>`;
- use a database lease so overlapping runs cannot publish conflicting batches;
- bound upstream requests and pagination;
- use a short timeout, at most two transient retries with jitter, and honor `Retry-After`;
- validate before transactional upsert;
- publish station/series batches atomically;
- retain the prior snapshot during failure;
- record run IDs, request/error counts, schema version, and publication state.

Security requirements are strict station allowlists, parameterized SQL, schema validation, upstream-host allowlists, output escaping, image-host restrictions, least-privilege credentials, secret-free logs, and no visitor write endpoints in the MVP.

## Accessibility and performance

The target is WCAG 2.2 AA plus manual verification. The current preview includes semantic headings, skip navigation, visible focus, keyboard links, text status labels, mobile layouts, and reduced-motion handling. Future maps and charts must be additive; a full list or accessible table remains the primary path.

Proposed targets from the plan are p75 LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1, and warm snapshot API p95 ≤ 750ms under a defined cached test. These are engineering goals, not measured claims about this preview.

Historical charts are deferred until series identity, units, depth, gaps, and timezone behavior are validated. When added, charts need an equivalent table and must not draw lines across missing observations.

## Deployment guide

### GitHub

Create one repository, commit the app, lockfile, migrations, reviewed content, fixtures, and `.env.example`. Do not commit `.env.local`, provider keys, database URLs, or cron secrets. Protect the production branch and run typecheck/build in CI.

### Vercel

Import the repository with the Next.js preset. Set a supported Node runtime and a function region near the database. Start with the Vercel-provided domain. Production, preview, and development environment variables must be scoped separately.

When the live integration is approved, configure names such as:

```text
DATABASE_URL
USGS_API_KEY
CRON_SECRET
NEXT_PUBLIC_SITE_URL
```

Only browser-safe values may use the `NEXT_PUBLIC_` prefix. Do not make normal builds depend on an available government API; use saved fixtures and seeded preview data for tests.

Apply reviewed migrations once through a controlled release job. Seed the reviewed station registry, explanations, status references, species import, and first valid snapshots. Trigger an authorized cron smoke test, then verify both a scheduled run and unauthorized failure. Record deployment ID, commit, migration version, station/config version, and rollback target.

### Cost guardrails

The plan targets a one-deployer, list-first release at approximately $50/month subject to actual database/backup quotes and measured use. It excludes extra Vercel seats, a custom domain, observability upgrades, and any fixed-egress/static-IP add-on. A map tile provider is a separate budget and reliability decision.

## Acceptance checklist

- [ ] At least one public water adapter and 3–5 verified configured stations, or a recorded scope exception.
- [ ] Every location selectable without a map or account.
- [ ] Every displayed result has value/qualifier, unit where applicable, station, collection time precision, source link, and provisional state when supplied.
- [ ] Each metric has reviewed meaning and ecological context.
- [ ] Wildlife cards preserve observation source/date and stated geography/time window.
- [ ] Status records preserve authority/scope/date; unknown stays unknown.
- [ ] Timeout, malformed payload, empty response, 429, and partial-station failures remain honest.
- [ ] No blocked primary flows at 360px, 200% zoom, or keyboard-only use.
- [ ] Protected cron, validated inputs, no private credentials in browser bundles.
- [ ] Replayed/overlapping imports are idempotent and cannot corrupt latest data.
- [ ] Outage drill preserves valid saved readings and communicates age.

## Source links

- [USGS Water Data API documentation](https://api.waterdata.usgs.gov/docs/)
- [USGS candidate station: 11162765](https://waterdata.usgs.gov/monitoring-location/USGS-11162765/)
- [Water Quality Portal user guide](https://www.waterqualitydata.us/portal_userguide/)
- [iNaturalist API recommended practices](https://www.inaturalist.org/pages/api+recommended+practices)
- [California CESA program](https://wildlife.ca.gov/Conservation/CESA)
- [USFWS species resources](https://www.fws.gov/program/endangered-species/species)
- [Next.js Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Leaflet](https://leafletjs.com/)
- [OpenStreetMap tile policy](https://operations.osmfoundation.org/policies/tiles/)
- [Vercel cron jobs](https://vercel.com/docs/cron-jobs)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## License and attribution

The application code can be licensed by the repository owner. Provider data, observation records, imagery, map tiles, taxonomic content, and conservation records retain their own source terms and attribution requirements. Review those terms before importing or redistributing any record or image.
