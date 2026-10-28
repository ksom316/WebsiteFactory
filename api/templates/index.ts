import { sendJson, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { withAuth } from '../_lib/auth.js'
import { handleApiError } from '../_lib/errors.js'
import { listTemplates } from '../_lib/db/queries/templates.js'

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  await withAuth(async (_req: ApiRequest, response: ApiResponse) => {
    try {
      const templates = await listTemplates()
      sendJson(response, 200, { templates })
    } catch (error) {
      handleApiError(response, error)
    }
  })(req, res)
}
