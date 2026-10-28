import { z } from 'zod'
import { sendJson, getQueryParams, readJsonBody, InvalidJsonError, PayloadTooLargeError, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { withAuth } from '../_lib/auth.js'
import { handleApiError } from '../_lib/errors.js'
import { getProjectById } from '../_lib/db/queries/projects.js'
import { listDeploymentRecords } from '../_lib/db/queries/deployments.js'
import { idSchema } from '../_lib/projectValidation.js'
import { isVercelConfigured } from '../_lib/vercel/client.js'
import { startDeployment, refreshDeploymentStatus } from '../_lib/deployment/deployProject.js'

function getProjectId(req: ApiRequest, res: ApiResponse): string | null {
  const raw = getQueryParams(req).get('id')
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) {
    sendJson(res, 400, { error: 'A valid project id is required' })
    return null
  }
  return parsed.data
}

/**
 * GET also doubles as "check status": any history row still `pending`/`building` is
 * polled against the live Vercel API before being returned, so the UI never has to
 * call a separate endpoint just to refresh a build in progress — consolidating what
 * would otherwise be two endpoints (status + history) into this one method.
 */
async function handleGet(res: ApiResponse, projectId: string): Promise<void> {
  try {
    const project = await getProjectById(projectId)
    const records = await listDeploymentRecords(projectId)
    const deployments = await Promise.all(records.map((record) => refreshDeploymentStatus(record)))
    sendJson(res, 200, {
      configured: isVercelConfigured(),
      vercelProjectId: project.vercelProjectId,
      deployments,
    })
  } catch (error) {
    handleApiError(res, error)
  }
}

const deployRequestSchema = z.object({
  environment: z.enum(['preview', 'production']).default('preview'),
})

async function handlePost(req: ApiRequest, res: ApiResponse, projectId: string): Promise<void> {
  if (!isVercelConfigured()) {
    sendJson(res, 503, {
      error: 'Vercel deployment is not configured. Set VERCEL_TOKEN (and optionally VERCEL_TEAM_ID) in the server environment, then restart.',
    })
    return
  }

  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) sendJson(res, 413, { error: 'Request body too large' })
    else if (error instanceof InvalidJsonError) sendJson(res, 400, { error: 'Invalid JSON body' })
    else sendJson(res, 400, { error: 'Invalid request' })
    return
  }

  const parsed = deployRequestSchema.safeParse(body ?? {})
  if (!parsed.success) {
    sendJson(res, 400, { error: 'Invalid deployment request' })
    return
  }

  try {
    // Always the project's *saved* state — the request body carries only which
    // environment to deploy to, never any configuration content, so unsaved editor
    // drafts can never reach a deployment.
    const project = await getProjectById(projectId)
    const record = await startDeployment({ project, environment: parsed.data.environment })
    sendJson(res, 201, { deployment: record })
  } catch (error) {
    handleApiError(res, error)
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  await withAuth(async (innerReq: ApiRequest, innerRes: ApiResponse) => {
    const id = getProjectId(innerReq, innerRes)
    if (!id) return
    if (innerReq.method === 'GET') await handleGet(innerRes, id)
    else await handlePost(innerReq, innerRes, id)
  })(req, res)
}
