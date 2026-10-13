# Baywatcher 2.0 release runbook

## Before merging

1. Review the PR and preview against the M1–M4 requirements in `v2-architecture.md`.
2. Run `pnpm check` and verify the Vercel deployment build.
3. Verify station names/coordinates against USGS metadata. The 2.0 refactor corrected several mismatches; do not restore the former public-name list.
4. Inspect exact series IDs, depths, methods, units, dates, and approval qualifiers for live readings. Different series remain separate.
5. Check the station list, keyboard selection, explanation disclosure, mobile layouts, and map attribution/failure behavior.
6. Test water and wildlife outages independently. Saved results retain original dates; empty successful responses remain empty.
7. Confirm NatureServe matches are exact and unambiguous, global ranks are distinct from federal status, and unknown remains unknown.

## Vercel configuration

Use the existing Next.js project/preset. Do not change the production branch until the refactor is approved.

- `USGS_LIVE_DATA_ENABLED`: enabled by default; set `false` for a clearly labeled dated offline demonstration.
- `USGS_API_KEY`: optional, server-only; use the provider's documented credential when required.
- `NEXT_PUBLIC_SITE_URL`: optional public URL.
- `DATABASE_URL` and `CRON_SECRET`: reserved; neither persistence nor cron ingestion is wired in v2.

Never put credentials in browser-safe public variables. Scope preview and production separately.

## Data and cache limitations

Live USGS requests have a five-second timeout each and run concurrently. Warm-instance successful water feeds are cached five minutes; successful wildlife results are cached ten minutes. Overlapping requests are coalesced. Instance caches are ephemeral: no durability or cross-instance consistency is claimed.

The last fallback is the inherited September 8, 2026 snapshot. Its values are dated and exact historical sensor metadata was not retained. UI labeling must make this visible. It is not promoted to an approved current reading.

For optional durable persistence, provision Supabase/PostgreSQL separately, review the retained migration, validate exact sensor choices, and implement repositories and last-known-good snapshots before claiming database-backed caching.

## Rollback

Keep the previous Vercel deployment. If a production release has a regression, restore that deployment through Vercel and revert the reviewed merge through GitHub. Record the affected route, station, request state, and reproduction steps in an issue; do not paste credentials or stack traces into user-facing messages.
