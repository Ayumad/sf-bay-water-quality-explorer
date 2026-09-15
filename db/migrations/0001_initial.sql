begin;

create table if not exists ingestion_runs (
  id uuid primary key,
  provider text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  state text not null check (state in ('running', 'published', 'failed', 'empty')),
  request_count integer not null default 0 check (request_count >= 0),
  record_count integer not null default 0 check (record_count >= 0),
  error_count integer not null default 0 check (error_count >= 0),
  schema_version text not null,
  detail jsonb not null default '{}'::jsonb
);

create table if not exists monitoring_stations (
  provider_id text primary key,
  slug text unique,
  name text not null,
  provider text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  site_type text,
  review_state text not null check (review_state in ('candidate', 'verified', 'retired')),
  source_url text not null,
  reviewed_at date,
  updated_at timestamptz not null default now()
);

create table if not exists measurement_series (
  provider_series_id text primary key,
  station_provider_id text not null references monitoring_stations(provider_id),
  metric text not null check (metric in ('temperature', 'dissolvedOxygen', 'ph', 'turbidity', 'conductivity')),
  parameter_code text not null,
  statistic_id text,
  raw_unit text not null,
  canonical_unit text,
  method text,
  depth text,
  expected_cadence interval,
  review_state text not null check (review_state in ('candidate', 'verified', 'retired')),
  reviewed_at date,
  updated_at timestamptz not null default now()
);

create table if not exists measurements (
  id bigint generated always as identity primary key,
  provider_result_id text,
  provider_series_id text not null references measurement_series(provider_series_id),
  raw_value text,
  parsed_value double precision,
  raw_unit text not null,
  canonical_unit text,
  collected_at timestamptz,
  collected_date date,
  time_precision text not null check (time_precision in ('instant', 'date', 'unknown')),
  approval_status text,
  qualifiers text[] not null default '{}',
  fetched_at timestamptz not null,
  source_url text not null,
  ingestion_run_id uuid not null references ingestion_runs(id),
  is_withdrawn boolean not null default false,
  constraint measurement_time_precision check (
    (time_precision = 'instant' and collected_at is not null and collected_date is null)
    or (time_precision = 'date' and collected_at is null and collected_date is not null)
    or (time_precision = 'unknown' and collected_at is null and collected_date is null)
  )
);

create unique index if not exists measurements_instant_identity_idx
  on measurements (provider_series_id, collected_at)
  where time_precision = 'instant';

create unique index if not exists measurements_date_identity_idx
  on measurements (provider_series_id, collected_date)
  where time_precision = 'date';

create unique index if not exists measurements_provider_result_idx
  on measurements (provider_result_id)
  where provider_result_id is not null;

create index if not exists measurements_latest_series_idx
  on measurements (provider_series_id, collected_at desc)
  where not is_withdrawn;

create table if not exists published_series_snapshots (
  provider_series_id text primary key references measurement_series(provider_series_id),
  measurement_id bigint not null references measurements(id),
  published_at timestamptz not null default now(),
  ingestion_run_id uuid not null references ingestion_runs(id)
);

commit;
