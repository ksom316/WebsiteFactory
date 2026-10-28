import { sendJson, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { withAuth, clearSessionCookie } from '../_lib/auth.js'

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  await withAuth((_req: ApiRequest, response: ApiResponse) => {
    clearSessionCookie(response)
    sendJson(response, 200, { ok: true })
  })(req, res)
}
