import type { ApiRequest, ApiResponse } from './http'

interface MockReqOptions {
  method?: string
  url?: string
  cookies?: Record<string, string>
  csrfHeader?: string
  jsonBody?: unknown
  ip?: string
}

export function createMockReq(options: MockReqOptions = {}): ApiRequest {
  const cookieHeader = Object.entries(options.cookies ?? {})
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('; ')

  const headers: Record<string, string> = {}
  if (cookieHeader) headers.cookie = cookieHeader
  if (options.csrfHeader) headers['x-csrf-token'] = options.csrfHeader
  if (options.ip) headers['x-forwarded-for'] = options.ip

  const bodyBuffer =
    options.jsonBody !== undefined ? Buffer.from(JSON.stringify(options.jsonBody)) : undefined

  const req = {
    method: options.method ?? 'GET',
    url: options.url ?? '/',
    headers,
    socket: { remoteAddress: options.ip ?? '127.0.0.1' },
    async *[Symbol.asyncIterator]() {
      if (bodyBuffer) yield bodyBuffer
    },
  }

  return req as unknown as ApiRequest
}

interface MockResState {
  statusCode: number
  headers: Record<string, string | string[]>
  body?: string
  ended: boolean
}

export function createMockRes(): { res: ApiResponse; state: MockResState } {
  const state: MockResState = { statusCode: 200, headers: {}, ended: false }

  const res = {
    get statusCode() {
      return state.statusCode
    },
    set statusCode(value: number) {
      state.statusCode = value
    },
    setHeader(name: string, value: string | string[]) {
      state.headers[name.toLowerCase()] = value
    },
    getHeader(name: string) {
      return state.headers[name.toLowerCase()]
    },
    end(chunk?: string) {
      state.body = chunk
      state.ended = true
    },
  }
  Object.defineProperty(res, 'headersSent', { get: () => state.ended })

  return { res: res as unknown as ApiResponse, state }
}

export function getJsonBody(state: MockResState): unknown {
  return state.body ? JSON.parse(state.body) : undefined
}

export function getCookies(state: MockResState): string[] {
  const raw = state.headers['set-cookie']
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}
