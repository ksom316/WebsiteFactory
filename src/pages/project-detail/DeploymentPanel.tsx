import { AlertTriangle, CheckCircle2, Clock, ExternalLink, Loader2, Rocket, XCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import {
  ApiError,
  fetchDeployments,
  startDeploymentRequest,
  type ConfigVersion,
  type DeploymentEnvironment,
  type DeploymentRecord,
  type Project,
} from '../../auth/apiClient'
import { getTemplateLabel } from '../../templates/parseConfig'

interface Props {
  project: Project
  latestVersion: ConfigVersion | undefined
}

const POLL_INTERVAL_MS = 4000

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function isInProgress(record: DeploymentRecord): boolean {
  return record.status === 'pending' || record.status === 'building'
}

function StatusBadge({ status }: { status: DeploymentRecord['status'] }) {
  const config = {
    pending: { icon: Clock, label: 'Preparing', className: 'bg-border/60 text-text-muted' },
    building: { icon: Loader2, label: 'Building', className: 'bg-accent/10 text-accent-strong', spin: true },
    success: { icon: CheckCircle2, label: 'Ready', className: 'bg-accent/10 text-accent-strong' },
    failed: { icon: XCircle, label: 'Failed', className: 'bg-danger/10 text-danger' },
  }[status]
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.className}`}>
      <Icon className={`h-3 w-3 ${config.spin ? 'animate-spin' : ''}`} strokeWidth={2} aria-hidden="true" />
      {config.label}
    </span>
  )
}

export function DeploymentPanel({ project, latestVersion }: Props) {
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<DeploymentEnvironment | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  // Bumped on a timer while a deployment is in progress, purely to re-run the fetch
  // effect below — see the second effect. Not meaningful on its own.
  const [pollTick, setPollTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetchDeployments(project.id)
      .then((result) => {
        if (cancelled) return
        setConfigured(result.configured)
        setDeployments(result.deployments ?? [])
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoadError(error instanceof ApiError ? error.message : 'Could not load deployment status.')
      })
    return () => {
      cancelled = true
    }
  }, [project.id, pollTick])

  // Poll while any deployment is still building, so the UI reaches a terminal state
  // (ready/failed) on its own instead of requiring a manual refresh.
  useEffect(() => {
    if (!deployments.some(isInProgress)) return
    const timer = setInterval(() => setPollTick((t) => t + 1), POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [deployments])

  if (!latestVersion) return null

  const variantLabel = getTemplateLabel(latestVersion.config)

  async function handleDeploy(environment: DeploymentEnvironment) {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setDeploying(true)
    setDeployError(null)
    try {
      const record = await startDeploymentRequest(project.id, environment)
      setDeployments((prev) => [record, ...prev])
      setConfirming(null)
    } catch (error) {
      setDeployError(error instanceof ApiError ? error.message : 'Could not start the deployment — try again.')
    } finally {
      inFlightRef.current = false
      setDeploying(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-text">Deploy to Vercel</p>
        {configured === false && (
          <span className="rounded-full bg-danger/10 px-2.5 py-1 text-xs font-medium text-danger">Not configured</span>
        )}
      </div>

      {configured === false && (
        <p className="flex items-start gap-1.5 text-sm text-text-muted">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.75} aria-hidden="true" />
          Deployment isn't set up yet. Set <code className="rounded bg-bg px-1 py-0.5 text-xs">VERCEL_TOKEN</code> in the
          server environment and restart to enable it.
        </p>
      )}

      {loadError && (
        <p role="alert" className="text-sm text-danger">
          {loadError}
        </p>
      )}

      {configured && (
        <>
          <p className="text-sm text-text-muted">
            Deploys version {latestVersion.versionNumber} (saved {formatDateTime(latestVersion.createdAt)}) of{' '}
            {project.name} — a {variantLabel} website — not your current unsaved draft, if any.
            {project.vercelProjectId && ' Reuses the already-linked Vercel project.'}
          </p>

          {deployError && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              {deployError}
            </p>
          )}

          {confirming ? (
            <div className="space-y-3 rounded-md border border-border-strong p-3">
              <p className="text-sm text-text">
                {confirming === 'production' ? (
                  <>
                    This updates the <strong>live production website</strong> for {project.name} with version{' '}
                    {latestVersion.versionNumber}. Visitors to the production URL will see this version immediately
                    once the build finishes.
                  </>
                ) : (
                  <>
                    This creates a new <strong>preview</strong> deployment of version {latestVersion.versionNumber} —
                    it gets its own URL and never affects a production site.
                  </>
                )}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={deploying}
                  onClick={() => handleDeploy(confirming)}
                  className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deploying ? 'Starting…' : confirming === 'production' ? 'Deploy to production' : 'Deploy preview'}
                </button>
                <button
                  type="button"
                  disabled={deploying}
                  onClick={() => setConfirming(null)}
                  className="rounded-md border border-border-strong px-3.5 py-2 text-sm font-medium text-text hover:border-text-faint disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirming('preview')}
                className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3.5 py-2 text-sm font-medium text-text transition-colors hover:border-text-faint"
              >
                <Rocket className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Deploy preview
              </button>
              <button
                type="button"
                onClick={() => setConfirming('production')}
                className="inline-flex items-center gap-2 rounded-md border border-danger/40 px-3.5 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
              >
                Deploy to production
              </button>
            </div>
          )}
        </>
      )}

      {deployments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-text">History</p>
          <ul className="divide-y divide-border rounded-md border border-border">
            {deployments.map((record) => (
              <li key={record.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize text-text-muted">
                      {record.environment}
                    </span>
                    <StatusBadge status={record.status} />
                  </div>
                  <p className="text-sm text-text-muted">{formatDateTime(record.createdAt)}</p>
                  {record.status === 'failed' && record.errorMessage && (
                    <p className="text-sm text-danger">{record.errorMessage}</p>
                  )}
                </div>
                {record.status === 'success' && record.deploymentUrl && (
                  <a
                    href={record.deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent-strong hover:underline"
                  >
                    Open site
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
