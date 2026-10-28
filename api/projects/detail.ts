import { sendJson, getQueryParams, readJsonBody, InvalidJsonError, PayloadTooLargeError, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { withAuth } from '../_lib/auth.js'
import { handleApiError } from '../_lib/errors.js'
import { getProjectById, getProjectVersions, updateProjectMeta } from '../_lib/db/queries/projects.js'
import { idSchema, updateProjectMetaSchema } from '../_lib/projectValidation.js'

function getProjectId(req: ApiRequest, res: ApiResponse): string | null {
  const raw = getQueryParams(req).get('id')
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) {
    sendJson(res, 400, { error: 'A valid project id is required' })
    return null
  }
  return parsed.data
}

async function handleGet(res: ApiResponse, id: string): Promise<void> {
  try {
    const project = await getProjectById(id)
    const versions = await getProjectVersions(id)
    sendJson(res, 200, { project, versions })
  } catch (error) {
    handleApiError(res, error)
  }
}

async function handlePatch(req: ApiRequest, res: ApiResponse, id: string): Promise<void> {
  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) sendJson(res, 413, { error: 'Request body too large' })
    else if (error instanceof InvalidJsonError) sendJson(res, 400, { error: 'Invalid JSON body' })
    else sendJson(res, 400, { error: 'Invalid request' })
    return
  }

  const parsed = updateProjectMetaSchema.safeParse(body)
  if (!parsed.success) {
    sendJson(res, 400, { error: 'Invalid update', issues: parsed.error.issues.map((i) => i.message) })
    return
  }

  try {
    const project = await updateProjectMeta(id, parsed.data)
    sendJson(res, 200, { project })
  } catch (error) {
    handleApiError(res, error)
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  await withAuth(async (innerReq: ApiRequest, innerRes: ApiResponse) => {
    const id = getProjectId(innerReq, innerRes)
    if (!id) return
    if (innerReq.method === 'GET') await handleGet(innerRes, id)
    else await handlePatch(innerReq, innerRes, id)
  })(req, res)
}
