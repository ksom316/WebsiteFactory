-- Phase 2: core schema (templates, projects, project config versions, deployment records)
create extension if not exists pgcrypto;

create table if not exists templates (
  id text primary key,
  name text not null,
  description text not null default '',
  version text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  business_name text,
  template_id text references templates(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'deployed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_template_id on projects(template_id);

create table if not exists project_config_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  config jsonb not null,
  created_at timestamptz not null default now(),
  unique (project_id, version_number)
);

create index if not exists idx_project_config_versions_project_id on project_config_versions(project_id);

create table if not exists deployment_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  provider text not null check (provider in ('vercel')),
  deployment_url text,
  provider_deployment_id text,
  status text not null default 'pending' check (status in ('pending', 'building', 'success', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deployment_records_project_id on deployment_records(project_id);
create index if not exists idx_deployment_records_status on deployment_records(status);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger trg_templates_updated_at
  before update on templates
  for each row execute function set_updated_at();

create or replace trigger trg_projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

create or replace trigger trg_deployment_records_updated_at
  before update on deployment_records
  for each row execute function set_updated_at();

insert into templates (id, name, description, version, is_active)
values ('corporate', 'Corporate', 'Standard corporate website template.', '0.1.0', true)
on conflict (id) do nothing;
