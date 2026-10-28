import { getSql, DatabaseError } from '../client.js'
import { NotFoundError, ConflictError } from '../../errors.js'
import { parseTemplateConfig, UnknownTemplateFamilyError, type AnyTemplateConfig } from '../../../../src/templates/parseConfig.js'

export type ProjectStatus = 'draft' | 'ready' | 'deployed' | 'archived'

export interface Project {
  id: string
  name: string
  slug: string
  businessName: string | null
  templateId: string | null
  status: ProjectStatus
  /** The Vercel project this factory project is linked to, once a deployment has
   * created or identified one — see api/_lib/deployment/deployProject.ts. */
  vercelProjectId: string | null
  createdAt: string
  updatedAt: string
}

export interface ConfigVersion {
  id: string
  projectId: string
  versionNumber: number
  config: AnyTemplateConfig
  createdAt: string
}

interface ProjectRow {
  id: string
  name: string
  slug: string
  business_name: string | null
  template_id: string | null
  status: ProjectStatus
  vercel_project_id: string | null
  created_at: string
  updated_at: string
}

interface ConfigVersionRow {
  id: string
  project_id: string
  version_number: number
  config: unknown
  created_at: string
}

/** Postgres SQLSTATE codes we handle specially — https://www.postgresql.org/docs/current/errcodes-appendix.html */
const PG_UNIQUE_VIOLATION = '23505'
const PG_NOT_NULL_VIOLATION = '23502'

function pgErrorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? (error as { code?: string }).code
    : undefined
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    businessName: row.business_name,
    templateId: row.template_id,
    status: row.status,
    vercelProjectId: row.vercel_project_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapConfigVersion(row: ConfigVersionRow): ConfigVersion {
  return {
    id: row.id,
    projectId: row.project_id,
    versionNumber: row.version_number,
    config: parseTemplateConfig(row.config),
    createdAt: row.created_at,
  }
}

const ACTIVE_STATUSES: ProjectStatus[] = ['draft', 'ready', 'deployed']

export interface ListProjectsOptions {
  status: 'active' | 'archived'
  limit: number
  offset: number
}

export interface ListProjectsResult {
  projects: Project[]
  total: number
}

export async function listProjects(options: ListProjectsOptions): Promise<ListProjectsResult> {
  const statuses = options.status === 'archived' ? ['archived'] : ACTIVE_STATUSES
  try {
    const sql = getSql()
    const rows = (await sql`
      select id, name, slug, business_name, template_id, status, vercel_project_id, created_at, updated_at,
             count(*) over() as total_count
      from projects
      where status = any(${statuses}::text[])
      order by updated_at desc
      limit ${options.limit} offset ${options.offset}
    `) as (ProjectRow & { total_count: string })[]

    return {
      projects: rows.map(mapProject),
      total: rows.length > 0 ? Number(rows[0].total_count) : 0,
    }
  } catch (error) {
    throw new DatabaseError(error)
  }
}

export async function getProjectById(id: string): Promise<Project> {
  try {
    const sql = getSql()
    const rows = (await sql`
      select id, name, slug, business_name, template_id, status, vercel_project_id, created_at, updated_at
      from projects
      where id = ${id}
    `) as ProjectRow[]

    if (rows.length === 0) throw new NotFoundError('Project not found')
    return mapProject(rows[0])
  } catch (error) {
    if (error instanceof NotFoundError) throw error
    throw new DatabaseError(error)
  }
}

/** Most recent config versions for a project, newest first, including their full config. */
export async function getProjectVersions(projectId: string, limit = 20): Promise<ConfigVersion[]> {
  try {
    const sql = getSql()
    const rows = (await sql`
      select id, project_id, version_number, config, created_at
      from project_config_versions
      where project_id = ${projectId}
      order by version_number desc
      limit ${limit}
    `) as ConfigVersionRow[]
    return rows.map(mapConfigVersion)
  } catch (error) {
    // A row with a `family` tag this build doesn't recognize is a data-integrity
    // problem, not a connectivity one — rethrown as-is so it reaches the API layer's
    // generic 500 fallback (see api/_lib/errors.ts#handleApiError) instead of being
    // mislabeled as "Database is currently unavailable."
    if (error instanceof UnknownTemplateFamilyError) throw error
    throw new DatabaseError(error)
  }
}

export async function getConfigVersionByNumber(
  projectId: string,
  versionNumber: number,
): Promise<ConfigVersion> {
  try {
    const sql = getSql()
    const rows = (await sql`
      select id, project_id, version_number, config, created_at
      from project_config_versions
      where project_id = ${projectId} and version_number = ${versionNumber}
    `) as ConfigVersionRow[]
    if (rows.length === 0) throw new NotFoundError('Configuration version not found')
    return mapConfigVersion(rows[0])
  } catch (error) {
    if (error instanceof NotFoundError) throw error
    if (error instanceof UnknownTemplateFamilyError) throw error
    throw new DatabaseError(error)
  }
}

export interface CreateProjectInput {
  name: string
  slug: string
  businessName?: string
  templateId: string
  config: AnyTemplateConfig
}

export interface CreateProjectResult {
  project: Project
  version: ConfigVersion
}

/**
 * Creates the project row and its first config version in a single compound SQL
 * statement (a data-modifying CTE chain), which Postgres executes as one atomic unit.
 * This is deliberate: the Neon serverless driver's HTTP mode (see db/client.ts) sends
 * one query per HTTP request with no persistent session to BEGIN/COMMIT across, so a
 * multi-statement client-side transaction isn't available here. A single compound
 * statement gets the same atomicity guarantee — either both rows exist, or neither does
 * — without needing a different (connection-based) driver for this one operation.
 */
export async function createProjectWithConfig(input: CreateProjectInput): Promise<CreateProjectResult> {
  try {
    const sql = getSql()
    const configJson = JSON.stringify(input.config)
    const rows = (await sql`
      with new_project as (
        insert into projects (name, slug, business_name, template_id, status)
        values (${input.name}, ${input.slug}, ${input.businessName ?? null}, ${input.templateId}, 'draft')
        returning id, name, slug, business_name, template_id, status, vercel_project_id, created_at, updated_at
      ),
      new_version as (
        insert into project_config_versions (project_id, version_number, config)
        select id, 1, ${configJson}::jsonb from new_project
        returning id, project_id, version_number, config, created_at
      )
      select
        np.id, np.name, np.slug, np.business_name, np.template_id, np.status, np.vercel_project_id, np.created_at, np.updated_at,
        nv.id as version_id, nv.project_id as version_project_id, nv.version_number, nv.config as version_config,
        nv.created_at as version_created_at
      from new_project np, new_version nv
    `) as (ProjectRow & {
      version_id: string
      version_project_id: string
      version_number: number
      version_config: unknown
      version_created_at: string
    })[]

    const row = rows[0]
    return {
      project: mapProject(row),
      version: mapConfigVersion({
        id: row.version_id,
        project_id: row.version_project_id,
        version_number: row.version_number,
        config: row.version_config,
        created_at: row.version_created_at,
      }),
    }
  } catch (error) {
    if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
      throw new ConflictError('A project with that slug already exists')
    }
    if (error instanceof UnknownTemplateFamilyError) throw error
    throw new DatabaseError(error)
  }
}

export interface UpdateProjectMetaInput {
  name?: string
  businessName?: string | null
  slug?: string
  status?: 'draft' | 'archived'
}

export async function updateProjectMeta(id: string, input: UpdateProjectMetaInput): Promise<Project> {
  try {
    const sql = getSql()
    const rows = (await sql`
      update projects set
        name = coalesce(${input.name ?? null}, name),
        business_name = case when ${input.businessName !== undefined} then ${input.businessName ?? null} else business_name end,
        slug = coalesce(${input.slug ?? null}, slug),
        status = coalesce(${input.status ?? null}, status)
      where id = ${id}
      returning id, name, slug, business_name, template_id, status, vercel_project_id, created_at, updated_at
    `) as ProjectRow[]

    if (rows.length === 0) throw new NotFoundError('Project not found')
    return mapProject(rows[0])
  } catch (error) {
    if (error instanceof NotFoundError) throw error
    if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
      throw new ConflictError('A project with that slug already exists')
    }
    throw new DatabaseError(error)
  }
}

export interface SaveConfigResult {
  version: ConfigVersion
  changed: boolean
}

/**
 * Saves a new config version only if it actually differs from the current latest one.
 * Version numbering is computed inside the INSERT itself (`max(version_number)+1`), so
 * two concurrent saves can't produce the same version_number for a project — the
 * `project_config_versions` unique constraint on (project_id, version_number) catches
 * that race and the loser gets a ConflictError (409) asking the caller to reload and
 * retry, rather than silently overwriting history.
 */
export async function saveConfigVersionIfChanged(
  projectId: string,
  config: AnyTemplateConfig,
): Promise<SaveConfigResult> {
  try {
    const sql = getSql()
    const latestRows = (await sql`
      select id, project_id, version_number, config, created_at
      from project_config_versions
      where project_id = ${projectId}
      order by version_number desc
      limit 1
    `) as ConfigVersionRow[]

    const latest = latestRows[0] ? mapConfigVersion(latestRows[0]) : null
    if (latest && JSON.stringify(latest.config) === JSON.stringify(config)) {
      return { version: latest, changed: false }
    }

    const configJson = JSON.stringify(config)
    const inserted = (await sql`
      insert into project_config_versions (project_id, version_number, config)
      select ${projectId}, coalesce(max(version_number), 0) + 1, ${configJson}::jsonb
      from project_config_versions
      where project_id = ${projectId}
      returning id, project_id, version_number, config, created_at
    `) as ConfigVersionRow[]

    return { version: mapConfigVersion(inserted[0]), changed: true }
  } catch (error) {
    if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
      throw new ConflictError('Someone else saved a newer version. Reload and try again.')
    }
    if (error instanceof UnknownTemplateFamilyError) throw error
    throw new DatabaseError(error)
  }
}

/**
 * Creates a new version whose config is an exact copy of an existing historical
 * version's config — restoring never mutates or deletes the historical row itself.
 */
export async function restoreConfigVersion(
  projectId: string,
  versionNumber: number,
): Promise<ConfigVersion> {
  try {
    const sql = getSql()
    const rows = (await sql`
      insert into project_config_versions (project_id, version_number, config)
      select
        ${projectId},
        coalesce((select max(version_number) from project_config_versions where project_id = ${projectId}), 0) + 1,
        (select config from project_config_versions where project_id = ${projectId} and version_number = ${versionNumber})
      returning id, project_id, version_number, config, created_at
    `) as ConfigVersionRow[]

    return mapConfigVersion(rows[0])
  } catch (error) {
    if (pgErrorCode(error) === PG_NOT_NULL_VIOLATION) {
      throw new NotFoundError('Configuration version not found')
    }
    if (pgErrorCode(error) === PG_UNIQUE_VIOLATION) {
      throw new ConflictError('Someone else saved a newer version. Reload and try again.')
    }
    if (error instanceof UnknownTemplateFamilyError) throw error
    throw new DatabaseError(error)
  }
}

/**
 * Records which Vercel project a factory project is linked to, the first time a
 * deployment creates or identifies one — so later deployments of the same project
 * reuse it (via `project:` in the Vercel API call) instead of creating a duplicate.
 * Safe to call repeatedly with the same id; it's a plain idempotent assignment.
 */
export async function linkVercelProject(projectId: string, vercelProjectId: string): Promise<void> {
  try {
    const sql = getSql()
    await sql`
      update projects set vercel_project_id = ${vercelProjectId}
      where id = ${projectId} and (vercel_project_id is null or vercel_project_id = ${vercelProjectId})
    `
  } catch (error) {
    throw new DatabaseError(error)
  }
}
