import { z } from 'zod'
import { sendJson, getQueryParams, readJsonBody, InvalidJsonError, PayloadTooLargeError, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { withAuth } from '../_lib/auth.js'
import { handleApiError } from '../_lib/errors.js'
import {
  getProjectById,
  getProjectVersions,
  getConfigVersionByNumber,
  saveConfigVersionIfChanged,
  restoreConfigVersion,
} from '../_lib/db/queries/projects.js'
import { idSchema } from '../_lib/projectValidation.js'
import { parseTemplateConfig, resolveFamily } from '../../src/templates/parseConfig.js'

function getProjectId(req: ApiRequest, res: ApiResponse): string | null {
  const raw = getQueryParams(req).get('id')
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) {
    sendJson(res, 400, { error: 'A valid project id is required' })
    return null
  }
  return parsed.data
}

function getVersionParam(req: ApiRequest): number | undefined {
  const raw = getQueryParams(req).get('version')
  if (raw === null) return undefined
  const parsed = z.coerce.number().int().positive().safeParse(raw)
  return parsed.success ? parsed.data : undefined
}

async function handleGet(req: ApiRequest, res: ApiResponse, id: string): Promise<void> {
  const version = getVersionParam(req)
  try {
    await getProjectById(id) // 404s cleanly if the project itself doesn't exist
    if (version !== undefined) {
      const found = await getConfigVersionByNumber(id, version)
      sendJson(res, 200, { version: found })
      return
    }
    const [latest] = await getProjectVersions(id, 1)
    if (!latest) {
      sendJson(res, 404, { error: 'This project has no configuration yet' })
      return
    }
    sendJson(res, 200, { version: latest })
  } catch (error) {
    handleApiError(res, error)
  }
}

const variantGate = z.object({ variant: z.enum(['premium', 'neutral']) }).partial()
const familyGate = z.object({ family: z.enum(['corporate', 'restaurant', 'real-estate', 'portfolio', 'catalog', 'ecommerce']) }).partial()

async function handlePut(req: ApiRequest, res: ApiResponse, id: string): Promise<void> {
  let body: unknown
  try {
    body = await readJsonBody(req)
  } catch (error) {
    if (error instanceof PayloadTooLargeError) sendJson(res, 413, { error: 'Request body too large' })
    else if (error instanceof InvalidJsonError) sendJson(res, 400, { error: 'Invalid JSON body' })
    else sendJson(res, 400, { error: 'Invalid request' })
    return
  }

  // Everything else in each family's own schema normalizes bad values to safe defaults
  // (see src/templates/{corporate,restaurant,real-estate}/schema.ts); `family`/`variant`
  // are structural enough that an unsupported value is rejected outright instead of
  // being silently swapped out. This gate is also what guarantees resolveFamily(body)
  // below can never throw: by the time it runs, body.family (if present) is already
  // known to be one of the recognized ids.
  const familyCheck = familyGate.safeParse(body)
  if (!familyCheck.success) {
    sendJson(res, 400, { error: 'Unsupported template family' })
    return
  }
  if (resolveFamily(body) === 'corporate') {
    const variantCheck = variantGate.safeParse(body)
    if (!variantCheck.success) {
      sendJson(res, 400, { error: 'Unsupported template variant' })
      return
    }
  }

  const config = parseTemplateConfig(body)

  try {
    await getProjectById(id)
    const { version, changed } = await saveConfigVersionIfChanged(id, config)
    sendJson(res, 200, { version, changed })
  } catch (error) {
    handleApiError(res, error)
  }
}

async function handlePost(req: ApiRequest, res: ApiResponse, id: string): Promise<void> {
  const version = getVersionParam(req)
  if (version === undefined) {
    sendJson(res, 400, { error: 'A valid version number is required' })
    return
  }

  try {
    await getProjectById(id)
    const restored = await restoreConfigVersion(id, version)
    sendJson(res, 201, { version: restored })
  } catch (error) {
    handleApiError(res, error)
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'PUT' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  await withAuth(async (innerReq: ApiRequest, innerRes: ApiResponse) => {
    const id = getProjectId(innerReq, innerRes)
    if (!id) return
    if (innerReq.method === 'GET') await handleGet(innerReq, innerRes, id)
    else if (innerReq.method === 'PUT') await handlePut(innerReq, innerRes, id)
    else await handlePost(innerReq, innerRes, id)
  })(req, res)
}
