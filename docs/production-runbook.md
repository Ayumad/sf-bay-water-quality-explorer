# Production data runbook

The public application defaults to its dated source snapshot. Set
USGS_LIVE_DATA_ENABLED=true only for a candidate-series preview; that mode
preserves time_series_id, depth, method, qualifier, and approval metadata but
does not make a verified publication claim.

## Coverage review

Before marking a series verified, record:

1. Monitoring-location ID and exact time-series ID.
2. Parameter and statistic codes.
3. Raw and canonical units.
4. Sublocation/depth and method.
5. Expected reporting cadence.
6. Earliest/newest timestamps and a captured response.
7. Reviewer and review date.

Upper and lower sensors are separate series. Never choose between them merely
because one appears first or has the newest tied timestamp.

## Database rollout

1. Provision PostgreSQL with encrypted connections and backups.
2. Apply db/migrations/0001_initial.sql once through a controlled release job.
3. Seed Git-reviewed station and series configuration.
4. Give the importer write access and the web runtime read-only access.
5. Use a PostgreSQL advisory lock around each provider import.
6. Validate an entire station/series batch before the transaction updates
   published_series_snapshots.
7. Keep the previous snapshot when a request fails or returns no usable records.

No database credential is required for the current preview. Adding the importer
is intentionally blocked on verified series choices and deployment credentials.

## Release checks

Run pnpm check, then verify:

- snapshot mode with no environment variables;
- live-preview mode with and without a USGS API key;
- timeout, malformed payload, empty collection, 429, and 5xx fallbacks;
- keyboard navigation and 360 px layout;
- every displayed reading includes series, collection time, unit, source, and
  any supplied qualifier/approval state.
