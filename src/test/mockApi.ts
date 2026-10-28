import { vi } from 'vitest'

interface MockApiOptions {
  authenticated?: boolean
}

/** Installs a minimal global.fetch mock covering the endpoints the app shell calls on mount. */
export function installMockApi({ authenticated = true }: MockApiOptions = {}) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()

    if (url.includes('/api/auth/session')) {
      return jsonResponse({ authenticated })
    }
    if (url.includes('/api/projects')) {
      return jsonResponse({ projects: [], total: 0 })
    }
    if (url.includes('/api/health')) {
      return jsonResponse({ status: 'ok', database: 'connected' })
    }
    if (url.includes('/api/auth/login')) {
      return jsonResponse({ ok: true })
    }
    if (url.includes('/api/auth/logout')) {
      return jsonResponse({ ok: true })
    }
    return jsonResponse({ error: 'not found' }, 404)
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
