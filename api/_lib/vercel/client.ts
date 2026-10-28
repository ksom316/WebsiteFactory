import { z } from 'zod'
import { requireEnv } from '../env.js'

const VERCEL_API_BASE = 'https://api.vercel.com'
const REQUEST_TIMEOUT_MS = 20_000
/** Defensive cap on the total deployment payload (files + base64 overhead). Real
 * exported sites are tens of KB of text; this only guards against something far
 * larger ever reaching this code path, rather than exhausting the function. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024
/** Defensive cap on how much of a Vercel response body we'll ever read/log. */
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024

export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_TOKEN)
}

export type VercelErrorKind = 'auth' | 'not_found' | 'conflict' | 'rate_limited' | 'upstream' | 'network' | 'timeout' | 'invalid_response' | 'too_large'

/** Never includes the token, the raw request, or the raw upstream response body —
 * only a short, fixed, category-appropriate message safe to show an administrator. */
export class VercelApiError extends Error {
  kind: VercelErrorKind
  status?: number
  constructor(message: string, kind: VercelErrorKind, status?: number) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

function mapStatusToError(status: number): VercelApiError {
  if (status === 401 || status === 403) {
    return new VercelApiError('Vercel rejected the configured token. Check VERCEL_TOKEN (and VERCEL_TEAM_ID, if set).', 'auth', status)
  }
  if (status === 404) {
    return new VercelApiError('The Vercel project or deployment could not be found.', 'not_found', status)
  }
  if (status === 409) {
    return new VercelApiError('This Vercel project is in a conflicting state (e.g. a transfer in progress). Try again shortly.', 'conflict', status)
  }
  if (status === 429) {
    return new VercelApiError('Vercel is rate-limiting this token right now. Try again in a minute.', 'rate_limited', status)
  }
  if (status >= 500) {
    return new VercelApiError('Vercel is currently having issues. Try again shortly.', 'upstream', status)
  }
  return new VercelApiError('Vercel rejected the request.', 'upstream', status)
}

async function vercelRequest(path: string, init: RequestInit): Promise<unknown> {
  const token = requireEnv('VERCEL_TOKEN')
  const teamId = process.env.VERCEL_TEAM_ID

  const url = new URL(`${VERCEL_API_BASE}${path}`)
  if (teamId) url.searchParams.set('teamId', teamId)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
      },
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new VercelApiError('Vercel did not respond in time.', 'timeout')
    }
    throw new VercelApiError('Could not reach Vercel.', 'network')
  } finally {
    clearTimeout(timeout)
  }

  const contentLength = Number(response.headers.get('content-length') ?? 0)
  if (contentLength > MAX_RESPONSE_BYTES) {
    throw new VercelApiError('Vercel returned an unexpectedly large response.', 'invalid_response', response.status)
  }

  const text = await response.text()

  if (!response.ok) {
    // Deliberately not forwarding `text` (the raw upstream body) to the caller or a
    // thrown error — only a server-side log, and even that never includes the token
    // (which only ever appears in the outgoing Authorization header, never logged).
    console.error('[vercel]', response.status, text.slice(0, 500))
    throw mapStatusToError(response.status)
  }

  try {
    return text ? JSON.parse(text) : {}
  } catch {
    throw new VercelApiError('Received an unexpected response from Vercel.', 'invalid_response', response.status)
  }
}

const deploymentResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  readyState: z.enum(['QUEUED', 'INITIALIZING', 'BUILDING', 'READY', 'ERROR', 'CANCELED', 'BLOCKED']),
  projectId: z.string().optional(),
  target: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
  errorCode: z.string().nullable().optional(),
})

export type VercelReadyState = z.infer<typeof deploymentResponseSchema>['readyState']

export interface VercelDeployment {
  id: string
  url: string
  readyState: VercelReadyState
  projectId: string | null
  errorMessage: string | null
}

function parseDeploymentResponse(data: unknown): VercelDeployment {
  const parsed = deploymentResponseSchema.safeParse(data)
  if (!parsed.success) {
    throw new VercelApiError('Received an unexpected response shape from Vercel.', 'invalid_response')
  }
  return {
    id: parsed.data.id,
    url: parsed.data.url,
    readyState: parsed.data.readyState,
    projectId: parsed.data.projectId ?? null,
    errorMessage: parsed.data.errorMessage ?? null,
  }
}

export interface DeploymentFile {
  path: string
  content: Uint8Array
}

export interface CreateDeploymentInput {
  /** Deterministic name used only when no existing Vercel project is linked yet
   * (e.g. "wf-riverside-landscaping"). Vercel reuses an existing project with this
   * exact name rather than creating a duplicate, so retries before a project id is
   * known still land on the same project. */
  projectName: string
  /** When a Vercel project is already linked (see projects.vercel_project_id),
   * pass its id instead — this is the precise, preferred way to target it. */
  existingVercelProjectId?: string | null
  files: DeploymentFile[]
  environment: 'preview' | 'production'
}

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64')
}

export async function createVercelDeployment(input: CreateDeploymentInput): Promise<VercelDeployment> {
  const totalBytes = input.files.reduce((sum, f) => sum + f.content.byteLength, 0)
  if (totalBytes > MAX_UPLOAD_BYTES) {
    throw new VercelApiError('The generated website is too large to deploy.', 'too_large')
  }

  const body: Record<string, unknown> = {
    files: input.files.map((f) => ({ file: f.path, data: toBase64(f.content), encoding: 'base64' })),
    projectSettings: { framework: 'vite' },
  }

  if (input.existingVercelProjectId) {
    body.project = input.existingVercelProjectId
  } else {
    body.name = input.projectName
  }

  if (input.environment === 'production') {
    body.target = 'production'
  }

  const data = await vercelRequest('/v13/deployments?skipAutoDetectionConfirmation=1', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return parseDeploymentResponse(data)
}

const DEPLOYMENT_ID_PATTERN = /^dpl_[a-zA-Z0-9]+$/

export async function getVercelDeployment(deploymentId: string): Promise<VercelDeployment> {
  if (!DEPLOYMENT_ID_PATTERN.test(deploymentId)) {
    throw new VercelApiError('Invalid deployment id.', 'invalid_response')
  }
  const data = await vercelRequest(`/v13/deployments/${encodeURIComponent(deploymentId)}`, { method: 'GET' })
  return parseDeploymentResponse(data)
}
