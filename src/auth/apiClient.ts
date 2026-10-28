import type { AnyTemplateConfig } from '../templates/parseConfig'

const CSRF_COOKIE = 'wf_csrf'

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers)
  const method = (init.method ?? 'GET').toUpperCase()

  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = readCookie(CSRF_COOKIE)
    if (csrfToken) headers.set('x-csrf-token', csrfToken)
  }
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')

  const response = await fetch(path, { ...init, method, headers, credentials: 'same-origin' })
  const text = await response.text()
  const data = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    const message = (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string')
      ? data.error
      : 'Request failed'
    throw new ApiError(response.status, message)
  }

  return data
}

export interface SessionStatus {
  authenticated: boolean
}

export function fetchSessionStatus(): Promise<SessionStatus> {
  return request('/api/auth/session') as Promise<SessionStatus>
}

export function login(username: string, password: string): Promise<{ ok: true }> {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }) as Promise<{ ok: true }>
}

export function logout(): Promise<{ ok: true }> {
  return request('/api/auth/logout', { method: 'POST' }) as Promise<{ ok: true }>
}

export interface HealthStatus {
  status: 'ok' | 'degraded'
  database: 'connected' | 'unavailable'
}

export function fetchHealth(): Promise<HealthStatus> {
  return request('/api/health') as Promise<HealthStatus>
}

export type ProjectStatus = 'draft' | 'ready' | 'deployed' | 'archived'

export interface Project {
  id: string
  name: string
  slug: string
  businessName: string | null
  templateId: string | null
  status: ProjectStatus
  vercelProjectId: string | null
  createdAt: string
  updatedAt: string
}

export interface ConfigVersion {
  id: string
  projectId: string
  versionNumber: number
  config: AnyTemplateConfig
  createdAt: string
}

export interface ListProjectsResult {
  projects: Project[]
  total: number
}

export function fetchProjects(options: { status?: 'active' | 'archived'; limit?: number; offset?: number } = {}): Promise<ListProjectsResult> {
  const params = new URLSearchParams()
  if (options.status) params.set('status', options.status)
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.offset !== undefined) params.set('offset', String(options.offset))
  const query = params.toString()
  return request(`/api/projects${query ? `?${query}` : ''}`) as Promise<ListProjectsResult>
}

export interface CreateProjectInput {
  name: string
  businessName?: string
  slug: string
  family: 'corporate' | 'restaurant' | 'real-estate' | 'portfolio' | 'catalog' | 'ecommerce'
  variant: 'premium' | 'neutral'
  industry?: string
  location?: string
}

export interface CreateProjectResult {
  project: Project
  version: ConfigVersion
}

export function createProject(input: CreateProjectInput): Promise<CreateProjectResult> {
  return request('/api/projects', { method: 'POST', body: JSON.stringify(input) }) as Promise<CreateProjectResult>
}

export interface ProjectDetail {
  project: Project
  versions: ConfigVersion[]
}

export function fetchProjectDetail(id: string): Promise<ProjectDetail> {
  return request(`/api/projects/detail?id=${encodeURIComponent(id)}`) as Promise<ProjectDetail>
}

export interface UpdateProjectMetaInput {
  name?: string
  businessName?: string | null
  slug?: string
  status?: 'draft' | 'archived'
}

export async function updateProjectMeta(id: string, input: UpdateProjectMetaInput): Promise<Project> {
  const data = (await request(`/api/projects/detail?id=${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })) as { project: Project }
  return data.project
}

export function fetchConfigVersion(id: string, version?: number): Promise<ConfigVersion> {
  const query = version !== undefined ? `&version=${version}` : ''
  return (
    request(`/api/projects/config?id=${encodeURIComponent(id)}${query}`) as Promise<{ version: ConfigVersion }>
  ).then((data) => data.version)
}

export async function saveConfig(id: string, config: AnyTemplateConfig): Promise<{ version: ConfigVersion; changed: boolean }> {
  return request(`/api/projects/config?id=${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(config),
  }) as Promise<{ version: ConfigVersion; changed: boolean }>
}

export async function restoreConfigVersion(id: string, versionNumber: number): Promise<ConfigVersion> {
  const data = (await request(`/api/projects/config?id=${encodeURIComponent(id)}&version=${versionNumber}`, {
    method: 'POST',
  })) as { version: ConfigVersion }
  return data.version
}

export interface ExportedFile {
  blob: Blob
  filename: string
}

const FILENAME_FROM_CONTENT_DISPOSITION = /filename="([^"]+)"/

/**
 * A plain GET, same as a browser navigation would make — no CSRF header is attached or
 * needed (see api/projects/export.ts). Done via fetch rather than a bare `<a href>` so
 * the UI can show real loading/error state instead of a silent background download.
 */
export async function exportProject(id: string): Promise<ExportedFile> {
  const response = await fetch(`/api/projects/export?id=${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'same-origin',
  })

  if (!response.ok) {
    let message = 'Export failed'
    try {
      const data = await response.json()
      if (data && typeof data === 'object' && typeof data.error === 'string') message = data.error
    } catch {
      // Non-JSON error body — fall back to the generic message above.
    }
    throw new ApiError(response.status, message)
  }

  const disposition = response.headers.get('Content-Disposition') ?? ''
  const match = FILENAME_FROM_CONTENT_DISPOSITION.exec(disposition)
  const filename = match ? match[1] : 'website.zip'
  const blob = await response.blob()
  return { blob, filename }
}

export type DeploymentStatus = 'pending' | 'building' | 'success' | 'failed'
export type DeploymentEnvironment = 'preview' | 'production'

export interface DeploymentRecord {
  id: string
  projectId: string
  provider: 'vercel'
  deploymentUrl: string | null
  providerDeploymentId: string | null
  status: DeploymentStatus
  environment: DeploymentEnvironment
  configVersionId: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface DeploymentStatusResult {
  configured: boolean
  vercelProjectId: string | null
  deployments: DeploymentRecord[]
}

export function fetchDeployments(projectId: string): Promise<DeploymentStatusResult> {
  return request(`/api/projects/deploy?id=${encodeURIComponent(projectId)}`) as Promise<DeploymentStatusResult>
}

export async function startDeploymentRequest(projectId: string, environment: DeploymentEnvironment): Promise<DeploymentRecord> {
  const data = (await request(`/api/projects/deploy?id=${encodeURIComponent(projectId)}`, {
    method: 'POST',
    body: JSON.stringify({ environment }),
  })) as { deployment: DeploymentRecord }
  return data.deployment
}
