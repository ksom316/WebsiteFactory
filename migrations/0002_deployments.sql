-- Phase 7: Vercel deployment integration.
--
-- Why this migration is needed (the existing schema from 0001_init.sql is not enough):
--   1. `deployment_records` has no way to know *which* Vercel project a deployment
--      belongs to across retries/subsequent deployments of the same client project —
--      that association has to live somewhere durable so we can reuse the same Vercel
--      project instead of creating a new one every time the administrator deploys.
--      It belongs on `projects` (one Vercel project per factory project), not on
--      `deployment_records` (one row per deployment attempt).
--   2. `deployment_records` has no environment column — preview and production
--      deployments must be distinguishable in history, and "environment" is not the
--      same axis as `status` (lifecycle: pending/building/success/failed).
--   3. `deployment_records` has no link back to the specific saved configuration
--      version that was deployed, which the project detail history view needs to show.
--
-- Forward-only: this only adds nullable/defaulted columns, so it is always safe to run
-- against a database that already has 0001_init.sql applied, and never mutates or
-- removes existing data.

alter table projects
  add column if not exists vercel_project_id text;

alter table deployment_records
  add column if not exists environment text not null default 'preview' check (environment in ('preview', 'production'));

alter table deployment_records
  add column if not exists config_version_id uuid references project_config_versions(id) on delete set null;

create index if not exists idx_deployment_records_config_version_id on deployment_records(config_version_id);
