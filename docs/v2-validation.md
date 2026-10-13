# Baywatcher 2.0 validation record

## Automated checks

- TypeScript: passed.
- ESLint with zero warnings: passed.
- Vitest: 24 tests passed across four files.
- Next.js optimized production build: passed.

Tests cover source normalization, sensor/depth separation, finite/missing/zero values, source host restrictions, corrected station identity, invalid/unknown route rejection before provider calls, preserved fallback timestamps, successful empty sources, malformed/duplicate taxa, image licensing/host validation, unambiguous scientific-name matches, failed status lookups, and wildlife/water independence.

## Browser checks

Headless Chrome against the local preview:

- Search trims whitespace and ignores case.
- No-results and clear-filter states work.
- List-only view is a complete alternative to map selection.
- Keyboard focus + Enter selects a station.
- Explanations expand with native disclosure controls.
- A failed refresh retains readings and displays a readable message.
- An obsolete delayed wildlife response cannot replace a newer station selection.
- Direct station profiles and share URLs stay synchronized.
- Field-guide and sources/methods routes render.
- Unknown station route returns 404.
- No document horizontal overflow at 1440, 768, 390, and 360 px.
- No uncaught page errors during the acceptance run.

## Live provider smoke checks

USGS returned readings for nine configured station IDs. Multiple depths/series were retained. iNaturalist returned six distinct taxa for the San Mateo Bridge request; several exact-name NatureServe matches returned global status labels, while unmatched taxa stayed unknown. This verifies connectivity during the run, not permanent availability or scientific publication approval.

## Remaining release verification

A formal screen-reader audit, sustained 100-user load test, deployed performance measurement, historical fixture sensor review, and optional persistent database wiring were not claimed as completed. Confirm these requirements in the target Vercel environment before production sign-off.
