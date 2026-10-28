import { getSql, DatabaseError } from '../client.js'
import { NotFoundError } from '../../errors.js'

export type DeploymentStatus = 'pending' | 'building' | 'success' | 'failed'
export type DeploymentEnvironment = 'preview' | 'production'

export interface DeploymentRecord {
  id: string
  projectId: string
  provider: 'vercel'
  deploymentUrl: string | null
  providerDeploymentId: string | null
  status: DeploymentStatus
  environment: DeploymentEnvironment
  configVersionId: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

interface DeploymentRecordRow {
  id: string
  project_id: string
  provider: 'vercel'
  deployment_url: string | null
  provider_deployment_id: string | null
  status: DeploymentStatus
  environment: DeploymentEnvironment
  config_version_id: string | null
  error_message: string | null
  created_at: string
  updated_at: string
}

function mapDeploymentRecord(row: DeploymentRecordRow): DeploymentRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    provider: row.provider,
    deploymentUrl: row.deployment_url,
    providerDeploymentId: row.provider_deployment_id,
    status: row.status,
    environment: row.environment,
    configVersionId: row.config_version_id,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const SELECT_COLUMNS = `
  id, project_id, provider, deployment_url, provider_deployment_id, status, environment,
  config_version_id, error_message, created_at, updated_at
`

export interface CreateDeploymentRecordInput {
  projectId: string
  environment: DeploymentEnvironment
  configVersionId: string | null
}

/** Inserted with status='pending' before the Vercel API is ever called, so there is
 * always a durable record of the attempt even if the network call never completes. */
export async function createDeploymentRecord(input: CreateDeploymentRecordInput): Promise<DeploymentRecord> {
  try {
    const sql = getSql()
    const rows = (await sql`
      insert into deployment_records (project_id, provider, status, environment, config_version_id)
      values (${input.projectId}, 'vercel', 'pending', ${input.environment}, ${input.configVersionId})
      returning ${sql.unsafe(SELECT_COLUMNS)}
    `) as DeploymentRecordRow[]
    return mapDeploymentRecord(rows[0])
  } catch (error) {
    throw new DatabaseError(error)
  }
}

export interface UpdateDeploymentRecordInput {
  status?: DeploymentStatus
  deploymentUrl?: string | null
  providerDeploymentId?: string | null
  errorMessage?: string | null
}

export async function updateDeploymentRecord(id: string, input: UpdateDeploymentRecordInput): Promise<DeploymentRecord> {
  try {
    const sql = getSql()
    const rows = (await sql`
      update deployment_records set
        status = coalesce(${input.status ?? null}, status),
        deployment_url = case when ${input.deploymentUrl !== undefined} then ${input.deploymentUrl ?? null} else deployment_url end,
        provider_deployment_id = case when ${input.providerDeploymentId !== undefined} then ${input.providerDeploymentId ?? null} else provider_deployment_id end,
        error_message = case when ${input.errorMessage !== undefined} then ${input.errorMessage ?? null} else error_message end
      where id = ${id}
      returning ${sql.unsafe(SELECT_COLUMNS)}
    `) as DeploymentRecordRow[]
    if (rows.length === 0) throw new NotFoundError('Deployment record not found')
    return mapDeploymentRecord(rows[0])
  } catch (error) {
    if (error instanceof NotFoundError) throw error
    throw new DatabaseError(error)
  }
}

export async function listDeploymentRecords(projectId: string, limit = 20): Promise<DeploymentRecord[]> {
  try {
    const sql = getSql()
    const rows = (await sql`
      select ${sql.unsafe(SELECT_COLUMNS)}
      from deployment_records
      where project_id = ${projectId}
      order by created_at desc
      limit ${limit}
    `) as DeploymentRecordRow[]
    return rows.map(mapDeploymentRecord)
  } catch (error) {
    throw new DatabaseError(error)
  }
}

export async function getDeploymentRecordById(id: string): Promise<DeploymentRecord> {
  try {
    const sql = getSql()
    const rows = (await sql`
      select ${sql.unsafe(SELECT_COLUMNS)}
      from deployment_records
      where id = ${id}
    `) as DeploymentRecordRow[]
    if (rows.length === 0) throw new NotFoundError('Deployment record not found')
    return mapDeploymentRecord(rows[0])
  } catch (error) {
    if (error instanceof NotFoundError) throw error
    throw new DatabaseError(error)
  }
}
