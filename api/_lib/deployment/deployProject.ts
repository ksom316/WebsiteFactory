import { buildSiteFiles } from '../export/buildSiteFiles.js'
import { NotFoundError } from '../errors.js'
import { getProjectVersions, linkVercelProject, type Project } from '../db/queries/projects.js'
import {
  createDeploymentRecord,
  updateDeploymentRecord,
  type DeploymentEnvironment,
  type DeploymentRecord,
  type DeploymentStatus,
} from '../db/queries/deployments.js'
import { createVercelDeployment, getVercelDeployment, VercelApiError, type VercelReadyState } from '../vercel/client.js'

function mapReadyStateToStatus(state: VercelReadyState): DeploymentStatus {
  switch (state) {
    case 'READY':
      return 'success'
    case 'ERROR':
    case 'CANCELED':
    case 'BLOCKED':
      return 'failed'
    default:
      // QUEUED / INITIALIZING / BUILDING
      return 'building'
  }
}

export interface StartDeploymentInput {
  project: Project
  environment: DeploymentEnvironment
}

/**
 * Starts a deployment: fetches the project's latest *saved* configuration (never
 * anything from the request body — see api/projects/deploy.ts), reuses the same
 * generated-website logic as ZIP export, and creates (or reuses) the Vercel project
 * and deployment in a single Vercel API call.
 *
 * A `deployment_records` row is written with status `pending` before Vercel is ever
 * called, and is always updated to a terminal/building status before this function
 * returns or throws — so a row never silently claims success for an incomplete or
 * failed attempt, and a record of every attempt survives even a network failure.
 */
export async function startDeployment(input: StartDeploymentInput): Promise<DeploymentRecord> {
  const [latest] = await getProjectVersions(input.project.id, 1)
  if (!latest) throw new NotFoundError('This project has no configuration to deploy yet')

  const record = await createDeploymentRecord({
    projectId: input.project.id,
    environment: input.environment,
    configVersionId: latest.id,
  })

  try {
    const { files } = buildSiteFiles({
      project: input.project,
      config: latest.config,
      versionNumber: latest.versionNumber,
    })

    const deployment = await createVercelDeployment({
      // A deterministic name (reused on every retry until we have a real project id)
      // means Vercel finds and reuses the same project by name instead of creating a
      // duplicate — see createVercelDeployment's doc comment.
      projectName: `wf-${input.project.slug}`,
      existingVercelProjectId: input.project.vercelProjectId,
      files: Object.entries(files).map(([path, content]) => ({ path, content })),
      environment: input.environment,
    })

    if (deployment.projectId && deployment.projectId !== input.project.vercelProjectId) {
      await linkVercelProject(input.project.id, deployment.projectId)
    }

    return await updateDeploymentRecord(record.id, {
      status: mapReadyStateToStatus(deployment.readyState),
      deploymentUrl: `https://${deployment.url}`,
      providerDeploymentId: deployment.id,
      errorMessage: deployment.errorMessage,
    })
  } catch (error) {
    const message = error instanceof VercelApiError ? error.message : 'Could not start the deployment — try again.'
    await updateDeploymentRecord(record.id, { status: 'failed', errorMessage: message })
    throw error
  }
}

/**
 * Polls Vercel for a still-in-progress record's real status. Never escalates a poll
 * failure into marking the deployment failed — a transient Vercel hiccup while
 * checking status shouldn't overwrite a deployment that might still succeed; the next
 * poll (or the administrator reloading the page) will simply try again.
 */
export async function refreshDeploymentStatus(record: DeploymentRecord): Promise<DeploymentRecord> {
  if (record.status !== 'pending' && record.status !== 'building') return record
  if (!record.providerDeploymentId) return record

  try {
    const deployment = await getVercelDeployment(record.providerDeploymentId)
    const status = mapReadyStateToStatus(deployment.readyState)
    if (status === record.status && deployment.errorMessage === record.errorMessage) return record
    return await updateDeploymentRecord(record.id, {
      status,
      errorMessage: deployment.errorMessage,
      deploymentUrl: `https://${deployment.url}`,
    })
  } catch {
    return record
  }
}
