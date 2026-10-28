import { useEffect, useState } from 'react'
import { fetchHealth, type HealthStatus } from '../../auth/apiClient'

type Status = 'checking' | HealthStatus['status'] | 'error'

export function HealthBadge() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    let cancelled = false
    fetchHealth()
      .then((health) => {
        if (!cancelled) setStatus(health.status)
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const label =
    status === 'checking'
      ? 'Checking…'
      : status === 'ok'
        ? 'Database connected'
        : 'Database unavailable'

  const dotColor = status === 'ok' ? 'bg-accent-strong' : status === 'checking' ? 'bg-text-faint' : 'bg-danger'

  return (
    <div className="inline-flex items-center gap-2 text-xs font-medium text-text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden="true" />
      {label}
    </div>
  )
}
