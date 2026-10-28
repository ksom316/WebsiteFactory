import { sendJson, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { isAuthenticated } from '../_lib/auth.js'
import { issueCsrfCookie } from '../_lib/csrf.js'

export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  const authenticated = await isAuthenticated(req)
  // Always (re)issue a CSRF cookie so the login form and future mutations have one.
  issueCsrfCookie(res)
  sendJson(res, 200, { authenticated })
}
