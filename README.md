# Baywatcher 2.0 · SF Bay Water Quality Explorer

A public, responsive environmental explorer built around Team SRVRRR’s PRD, SAD, SFDS, Test Plan, and Project Plan. Visitors choose a Bay/watershed monitoring station, read actual source measurements with explanations, and explore nearby wildlife and conservation context without an account.

## Run locally

Node.js 20.19+ and the pnpm version in `package.json` are required.

```sh
pnpm install --frozen-lockfile
pnpm dev
# http://localhost:3000
pnpm check
```

`pnpm check` runs lint, TypeScript, Vitest, and the production build. Tests use simulated providers; normal builds do not need external API access. The existing Vitest harness is retained rather than introducing a second runner alongside the specification’s Jest terminology.

## What changed in 2.0

- A complete new interface: estuary-green / warm-paper visual system, responsive introduction, searchable station list, optional map, five measurement cards, plain-language explanations, and wildlife cards.
- All nine configured source stations now have working profiles and measurement routes, instead of one profile with permanently unpublished values.
- Incorrect first-draft station names corrected against official USGS monitoring-location metadata. For example, `USGS-11455780` is **Suisun Bay at Benicia Bridge**, not Napa River at Napa; `USGS-11162690` is **San Francisco Bay at Presidio**, not Point San Pablo.
- Bounded live USGS integration is enabled by default, with five-second request timeouts, validated source values, and saved fallback content. Set `USGS_LIVE_DATA_ENABLED=false` for an explicitly dated offline demonstration.
- Separate iNaturalist observation requests and exact-name NatureServe conservation lookups. Wildlife failures never block water data; unknown status never means unthreatened.
- Improved handling of empty results, missing fields, preserved zero values, late station responses, unsupported taxa, and outage notices.
- Privacy-aware observation cards: no precise observation coordinates; only explicitly reusable photos, with returned attribution and license.
- Tests for unknown-station rejection, station identity, zero/missing values, saved timestamps, outages, malformed observations, taxon matching, and conservation-provider isolation.

## Architecture and module contracts

| Module             | Implementation                                                | Contract                                                                                                                               |
| ------------------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| M1 Location        | `src/lib/data.ts`, `/api/stations`, dashboard search/list/map | Configured station ID, name, coordinates, and source; no external requests needed for selection                                        |
| M2 Water Quality   | `src/lib/providers/usgs.ts`, `src/lib/services/water.ts`      | `MapFeed` containing distinct `MapMeasurement` records with values, units, source time, depth, method, qualifiers, and series identity |
| M3 Wildlife        | `src/lib/services/wildlife.ts`                                | `WildlifeResult` with dated `SpeciesObservation` records and nullable `ConservationStatus`                                             |
| M4 Fallback        | water and wildlife service boundaries                         | Original saved data + original retrieval/collection dates + explicit fallback message; otherwise a readable unavailable state          |
| M5 Accounts/Alerts | Deferred                                                      | No accounts, saved visitor locations, notifications, or visitor writes                                                                 |

Water and wildlife are fetched independently. The initial page provides server-rendered water results. Wildlife loads after selection and cancels an obsolete request when the visitor chooses another station. Map loading is independent; a searchable list is always available.

The services share provider-independent UI contracts without creating a browser-to-server-to-self HTTP loop. Server pages call services directly. Browser refresh and wildlife requests use bounded read-only routes.

## Routes

| Route                               | Behavior                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------- |
| `/`                                 | Main explorer; optional `?station=<configured-slug>` for sharing selection |
| `/stations/[slug]`                  | Configured station profile and explorer                                    |
| `/learn/metrics`                    | Sourced measurement explanations and contextual reference bands            |
| `/about/data`                       | Sources, freshness, wildlife methodology, accessibility, and limitations   |
| `/api/stations?q=<term>`            | Configured metadata; case-insensitive search, max 100 characters           |
| `/api/map-points`                   | Bounded shared water feed                                                  |
| `/api/stations/[slug]/measurements` | Station measurements with fallback state and retrieval metadata            |
| `/api/stations/[slug]/wildlife`     | Up to six distinct taxa, within 5 km and the previous year                 |
| `/api/health`                       | Minimal health response                                                    |

Unknown station slugs return 404 before external calls; invalid slugs return 400. External hosts are fixed, station IDs are allowlisted, provider responses are validated, and secrets remain server-side.

## Data behavior

USGS queries `latest-continuous`, `monitoring-locations`, and `time-series-metadata` for the station allowlist. Requests run in parallel with a five-second timeout each. Results preserve exact series, units, time, method/depth, qualifiers, and provisional approval metadata. Different sensor depths are never averaged. Blank values are not zero. Missing required timestamps/units are excluded.

The server coalesces overlapping water fetches and caches a successful feed for five minutes in a warm instance. On failure it uses the prior response, or the original September 8, 2026 source fixture. The fixture did not retain exact historical sensor IDs/depths; the UI explicitly identifies it as a saved snapshot, not current conditions. Original collection times remain visible, including genuinely archived readings. A successful empty source returns no data rather than invoking outage fallback.

Wildlife requests retrieve up to 50 research-grade iNaturalist observations, then display at most six distinct taxa. Each retains observation date, source link, organism group, and optional attribution/license. An observation is not a census or proof of a current condition. NatureServe queries are limited to these taxa, use exact scientific names, and share a five-second status deadline. Ambiguous matches or failed lookups leave status null. Global G-ranks are labeled separately from available federal legal-status codes. The app neither equates common names nor reuses numeric IDs across providers.

Successful wildlife responses are cached for ten minutes per station in a warm instance. A later outage can reuse those records with their original dates. With no saved observations, the UI displays an unavailable message; working water results are preserved.

**Caches are not durable.** They are per server instance and may disappear on redeploy or cold start. Supabase PostgreSQL persistence is optional per the SFDS; the existing migration remains available for a separately configured persistence implementation. No database connection is claimed without credentials and runtime wiring.

## Environment and deployment

```text
USGS_LIVE_DATA_ENABLED=true
USGS_API_KEY=                   # optional, server-only
NEXT_PUBLIC_SITE_URL=           # optional public URL
DATABASE_URL=                   # reserved for optional persistence, not wired
CRON_SECRET=                    # reserved; no importer/cron is enabled
```

Use Vercel’s Next.js preset. Production, preview, and development credentials must be scoped separately. Only browser-safe values may use the `NEXT_PUBLIC_` prefix. Secrets are excluded from Git. The USGS public service and iNaturalist/NatureServe public reads worked during validation, but credentials/provider availability may change; outages must remain readable.

## Validation

Automated checks: lint, TypeScript, Vitest, production build. Browser checks: desktop/mobile layouts, no document overflow, search, station switching, map/list controls, explanations, field guide, unknown routes, provider failures, and delayed obsolete wildlife responses. Live provider smoke checks are separate from deterministic tests.

See `docs/v2-validation.md` for the validation record and `docs/v2-architecture.md` for traceability and release limitations.

## Product boundaries

The application is educational. It does not determine drinking, swimming, fishing, pet, or public-health safety. No single “water quality score” is created. Missing measurements remain unavailable; missing conservation information remains unknown. Measurement collection time is never replaced with page-load time.

The initial acceptance target is the documented MVP: selected locations, actual water data, readable explanations, wildlife context, and reliable fallback handling. Review exact source coverage and sensor identity, deployment-specific accessibility/performance, and any persistent-cache decision before declaring production readiness. No claim is made that the 100-user or approximately three-second targets have already been demonstrated under load.

## Sources

- [USGS Water Data API](https://api.waterdata.usgs.gov/docs/)
- [iNaturalist API](https://api.inaturalist.org/v1/docs/)
- [NatureServe Explorer API](https://explorer.natureserve.org/api-docs/)
- [EPA Water Quality Portal](https://www.waterqualitydata.us/)
- Metric explanations link directly to USGS and EPA sources in the field guide.

Provider content and imagery retain their attribution and licensing requirements. Map attribution is visible in Leaflet. Accounts, alerts, historical charts, scheduled ingestion, persistent caching, EPA sample ingestion, and habitat-layer exploration are deferred from this focused 2.0 MVP.
