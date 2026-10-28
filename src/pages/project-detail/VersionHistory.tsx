import { useState } from 'react'
import type { ConfigVersion } from '../../auth/apiClient'
import { Button } from '../../components/ui/Button'

interface Props {
  versions: ConfigVersion[]
  currentVersionNumber: number
  onRestore: (versionNumber: number) => Promise<void>
  restoring: boolean
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export function VersionHistory({ versions, currentVersionNumber, onRestore, restoring }: Props) {
  const [confirmingVersion, setConfirmingVersion] = useState<number | null>(null)

  if (versions.length === 0) {
    return <p className="text-sm text-text-muted">No saved versions yet.</p>
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
      {versions.map((version) => {
        const isCurrent = version.versionNumber === currentVersionNumber
        const confirming = confirmingVersion === version.versionNumber

        return (
          <li key={version.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <div>
              <p className="text-sm font-medium text-text">
                Version {version.versionNumber}
                {isCurrent && (
                  <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent-strong">
                    Current
                  </span>
                )}
              </p>
              <p className="text-sm text-text-muted">{formatDate(version.createdAt)}</p>
            </div>

            {!isCurrent && (
              <div className="flex items-center gap-2">
                {confirming ? (
                  <>
                    <span className="text-sm text-text-muted">Restore this version?</span>
                    <Button
                      variant="primary"
                      disabled={restoring}
                      onClick={async () => {
                        await onRestore(version.versionNumber)
                        setConfirmingVersion(null)
                      }}
                    >
                      Yes, restore
                    </Button>
                    <Button variant="secondary" disabled={restoring} onClick={() => setConfirmingVersion(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    disabled={restoring}
                    onClick={() => setConfirmingVersion(version.versionNumber)}
                  >
                    Restore
                  </Button>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
