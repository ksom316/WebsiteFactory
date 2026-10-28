import type { IncomingMessage, ServerResponse } from 'node:http'

export type ApiRequest = IncomingMessage & { body?: unknown }
export type ApiResponse = ServerResponse

const MAX_BODY_BYTES = 1024 * 100 // 100KB is generous for this app's JSON payloads.

export async function readJsonBody(req: ApiRequest): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined

  const chunks: Buffer[] = []
  let size = 0

  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) {
      throw new PayloadTooLargeError()
    }
    chunks.push(chunk)
  }

  if (chunks.length === 0) return undefined

  const raw = Buffer.concat(chunks).toString('utf8')
  if (raw.trim() === '') return undefined

  try {
    return JSON.parse(raw)
  } catch {
    throw new InvalidJsonError()
  }
}

export class PayloadTooLargeError extends Error {}
export class InvalidJsonError extends Error {}

export function parseCookies(req: ApiRequest): Record<string, string> {
  const header = req.headers.cookie
  if (!header) return {}

  const result: Record<string, string> = {}
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    const key = part.slice(0, index).trim()
    const value = part.slice(index + 1).trim()
    if (!key) continue
    try {
      result[key] = decodeURIComponent(value)
    } catch {
      result[key] = value
    }
  }
  return result
}

interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Strict' | 'Lax' | 'None'
  path?: string
  maxAgeSeconds?: number
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const segments = [`${name}=${encodeURIComponent(value)}`]
  segments.push(`Path=${options.path ?? '/'}`)
  if (options.maxAgeSeconds !== undefined) segments.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`)
  segments.push(`SameSite=${options.sameSite ?? 'Lax'}`)
  if (options.httpOnly) segments.push('HttpOnly')
  if (options.secure) segments.push('Secure')
  return segments.join('; ')
}

export function appendSetCookie(res: ApiResponse, cookie: string): void {
  const existing = res.getHeader('Set-Cookie')
  if (!existing) {
    res.setHeader('Set-Cookie', cookie)
  } else if (Array.isArray(existing)) {
    res.setHeader('Set-Cookie', [...existing, cookie])
  } else {
    res.setHeader('Set-Cookie', [String(existing), cookie])
  }
}

export function sendJson(res: ApiResponse, statusCode: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  // Blocks MIME-sniffing (a browser deciding to interpret this response as something
  // other than what Content-Type says) — cheap, zero functional risk, standard practice
  // for any API response that isn't meant to be rendered as a page.
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.end(payload)
}

/** Sends binary content (e.g. a generated ZIP) with a sanitized download filename. The
 * caller is responsible for ensuring `filename` is already safe (see
 * api/_lib/export/sanitize.ts#sanitizeFilenameSegment) — this only quotes it. */
export function sendBinary(res: ApiResponse, statusCode: number, body: Uint8Array, contentType: string, filename?: string): void {
  res.statusCode = statusCode
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (filename) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  }
  res.end(Buffer.from(body))
}

/**
 * All API routes here use static file paths (no Vercel `[param].ts` dynamic segments —
 * see vite/apiDevPlugin.ts's header comment for why), so resource ids are passed as
 * query parameters instead, e.g. `/api/projects/detail?id=<uuid>`.
 */
export function getQueryParams(req: ApiRequest): URLSearchParams {
  const url = req.url ?? ''
  const queryIndex = url.indexOf('?')
  return new URLSearchParams(queryIndex === -1 ? '' : url.slice(queryIndex + 1))
}

export function getClientIp(req: ApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.socket.remoteAddress ?? 'unknown'
}
