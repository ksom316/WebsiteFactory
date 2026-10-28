import { sendBinary, sendJson, getQueryParams, type ApiRequest, type ApiResponse } from '../_lib/http.js'
import { withAuth } from '../_lib/auth.js'
import { handleApiError, NotFoundError } from '../_lib/errors.js'
import { getProjectById, getProjectVersions } from '../_lib/db/queries/projects.js'
import { buildExportZip } from '../_lib/export/buildExportZip.js'
import { idSchema } from '../_lib/projectValidation.js'

/**
 * GET-only by design: a ZIP download is naturally triggered by browser navigation or a
 * plain fetch, neither of which can attach a custom CSRF header, and GET requests are
 * already exempt from this app's CSRF checks (see api/_lib/auth.ts#withAuth) because
 * they're expected to be side-effect-free — which exporting genuinely is: it only reads
 * the project's already-saved configuration and returns a transformation of it.
 */
export default async function handler(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  await withAuth(async (innerReq: ApiRequest, innerRes: ApiResponse) => {
    const raw = getQueryParams(innerReq).get('id')
    const parsedId = idSchema.safeParse(raw)
    if (!parsedId.success) {
      sendJson(innerRes, 400, { error: 'A valid project id is required' })
      return
    }

    try {
      const project = await getProjectById(parsedId.data)
      const [latest] = await getProjectVersions(parsedId.data, 1)
      if (!latest) throw new NotFoundError('This project has no configuration yet')

      const { bytes, filename } = buildExportZip({
        project,
        config: latest.config,
        versionNumber: latest.versionNumber,
      })

      sendBinary(innerRes, 200, bytes, 'application/zip', filename)
    } catch (error) {
      handleApiError(innerRes, error)
    }
  })(req, res)
}
