# Version 2.0 architecture and requirement alignment

## Product purpose

Turn selected San Francisco Bay/watershed source measurements into understandable environmental information. Anonymous browser access, station map/list selection, plain-language interpretation, available wildlife context, and graceful degradation are the core workflows.

## Requirement traceability

| Requirement                            | Delivery                                                                                                                 |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| REQ-FUNC-001 Water measurements        | Server-side bounded USGS adapter; station measurement API and dashboard cards                                            |
| REQ-FUNC-002 Location selection/search | All nine configured stations selectable in searchable list, map, and direct profile; metadata independent of providers   |
| REQ-FUNC-003 Explanations              | Per-card disclosure, complete field guide, source links                                                                  |
| REQ-FUNC-004 Wildlife                  | Bounded iNaturalist query, observation dates and attribution, dedicated loading/empty/unavailable states                 |
| REQ-FUNC-005 Conservation              | Exact scientific-name NatureServe matching; nullable unknown state; global ranks distinguished from federal codes        |
| REQ-FUNC-006 Fallback                  | Five-second external request timeout; old data/date preserved, degraded notices, independent module failures             |
| REQ-FUNC-007 Accounts/alerts           | Explicitly deferred; no new authentication or visitor writes                                                             |
| Responsive/accessibility               | Desktop/mobile layouts, map alternative, labels, native controls/details, visible focus, skip link, reduced motion       |
| Security                               | Server-side external calls, fixed hosts, configured slug allowlist, bounded searches, no HTML rendering of provider data |
| Accuracy                               | Separate series/depths/units; real zero preserved; invalid timestamp/unit rejected; no neighbor substitution             |

## Request flow

1. Server-rendered page resolves configured M1 station metadata and calls the water service.
2. M2 retrieves USGS measurements and metadata concurrently, using allowlisted IDs.
3. The dashboard displays each measurement’s original date and source; explanations are local.
4. After selection, M3 requests nearby dated observations, then looks up only those taxa’s exact scientific names in NatureServe. In parallel, one bounded batched iNaturalist taxa request supplies explicitly reusable reference photos for sightings without a reusable observation image. Reference images require both taxon ID and scientific name to match; photo failure leaves observation cards intact.
5. A canceled/obsolete browser request cannot overwrite the selected station’s wildlife panel.
6. M4 catches provider failures independently: water keeps saved readings or dated source fixture; wildlife keeps cached observations or a readable message.

## Deliberate limits

- Provider metadata validates the corrected station names/coordinates, but historical fixture series identities were not retained in 1.0.
- A public source reading is not a separately approved scientific publication or safety rating.
- Both caches are per-instance and ephemeral. The optional database schema is retained, but no Supabase credentials/runtime persistence were available or invented.
- The existing Vitest runner is retained. The project documents’ Jest wording describes the intended automated behavior, not a second required toolchain.
- NatureServe's public API supports exact-name searches; it does not accept iNaturalist numeric taxon IDs as its own. Matching remains conservative and nullable.
- The 1.0 habitat/NOAA focus is removed from the main visitor flow to align with the documented M1–M4 MVP. Provider adapters can remain for future work.
- API failures are logged as module/provider/event/fallback summaries without credentials or stack traces.
- Warm page, API caching, and code-splitting support responsiveness, but a 100-user test and formal deployed accessibility/performance audit remain release checks.

## Release process

Review the PR and Vercel preview, confirm station/sensor coverage, run the automated checks, then approve deployment. Keep the previous deployment available for rollback. Production configuration may opt out of live USGS requests with `USGS_LIVE_DATA_ENABLED=false` for a clearly labeled dated demonstration.

## Exploration flow

A four-step navigation follows station selection, water readings, nearby wildlife, and the field guide. The selected-location cue links directly to readings or wildlife. Field-guide links preserve the selected station and offer a contextual return. Dedicated profiles show readings and wildlife with a change-station link, avoiding a repeated map/picker. Metric cards include a short explanation before optional source details.
